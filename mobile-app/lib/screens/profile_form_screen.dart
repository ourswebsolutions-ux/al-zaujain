import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/common.dart';
import '../widgets/pickers.dart';
import 'auth_screens.dart';
import 'info_screens.dart';
import 'my_profile_screen.dart';

class _Picked {
  _Picked(this.name, this.bytes);
  final String name;
  final Uint8List bytes;
}

/// The website's step-by-step profile form (components/forms/ProfileWizard.jsx), built from the
/// form definition the website sends, so both always ask exactly the same questions.
///
/// Without [code] it submits a new profile; with [code] it edits one, using the member's account
/// or the profile's private manage link ([token]).
class ProfileFormScreen extends StatefulWidget {
  const ProfileFormScreen({super.key, this.code, this.token, this.initial, this.photos = const [], this.photoPublic = true, this.verification = 'not_submitted'});
  final String? code;
  final String? token;
  final Json? initial;
  final List<Json> photos;
  final bool photoPublic;
  final String verification;

  bool get editing => code != null;

  @override
  State<ProfileFormScreen> createState() => _ProfileFormScreenState();
}

class _ProfileFormScreenState extends State<ProfileFormScreen> {
  late final List<Json> sections = ((app.config['form'] as List?) ?? []).cast<Map>().map((item) => item.cast<String, dynamic>()).toList();
  final Map<String, String> values = {};
  Map<String, String> errors = {};
  int step = 0;
  bool busy = false;
  String? message;
  final List<_Picked> photos = [];
  final List<int> removed = [];
  _Picked? front;
  _Picked? back;
  late bool showPhoto = widget.photoPublic;
  bool consent = false;
  final scroll = ScrollController();
  final picker = ImagePicker();

  int get maxPhotos => (app.config['maxPhotos'] as num?)?.toInt() ?? 6;
  bool get draftable => !widget.editing;

  @override
  void initState() {
    super.initState();
    final start = <String, Object?>{
      if (!widget.editing && app.signedIn) 'contact_email': app.user?['email'],
      if (!widget.editing && app.signedIn) 'contact_phone': app.user?['phone'],
      ...?widget.initial,
      if (draftable) ...?app.formDraft,
    };
    start.forEach((key, value) {
      if (value != null) values[key] = '$value';
    });
  }

  void _change(String name, String value) {
    setState(() {
      values[name] = value;
      errors.remove(name);
    });
    if (draftable) app.saveFormDraft(values);
  }

  Json get section => sections[step];
  bool get last => step == sections.length - 1;

  void _goTo(int next) {
    setState(() { step = next; message = null; });
    if (scroll.hasClients) scroll.jumpTo(0);
  }

  Future<void> _next() async {
    FocusScope.of(context).unfocus();
    setState(() => busy = true);
    try {
      final result = await app.api.post('form/validate', {'section': section['key'], 'values': values});
      final stepErrors = ((result['errors'] as Map?) ?? {}).map((key, value) => MapEntry('$key', '$value'));
      if (stepErrors.isNotEmpty) {
        setState(() { errors = stepErrors; message = 'Please correct the highlighted fields.'; });
      } else {
        setState(() => errors = {});
        _goTo(step + 1);
      }
    } on ApiException catch (error) {
      setState(() => message = error.message);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> _submit() async {
    if (!widget.editing && !consent) {
      setState(() => message = 'Please confirm the consent statement.');
      return;
    }
    setState(() { busy = true; message = null; });
    final fields = <MapEntry<String, String>>[
      MapEntry('data', jsonEncode(values)),
      MapEntry('photo_public', showPhoto ? 'yes' : 'no'),
      if (consent) const MapEntry('consent', 'yes'),
      if (widget.token != null) MapEntry('manage_token', widget.token!),
      for (final id in removed) MapEntry('remove_photo', '$id'),
    ];
    final files = [
      for (final photo in photos) UploadFile('photos', photo.bytes, photo.name),
      if (front != null) UploadFile('cnic_front', front!.bytes, front!.name),
      if (back != null) UploadFile('cnic_back', back!.bytes, back!.name),
    ];
    try {
      final result = await app.api.multipart(widget.editing ? 'profiles/${widget.code}' : 'profiles', fields, files);
      if (!mounted) return;
      if (widget.editing) {
        showMessage(context, '${result['message']}');
        Navigator.pop(context, true);
        return;
      }
      await app.saveFormDraft(null);
      final code = '${result['code']}';
      final token = result['manageToken'] as String?;
      if (token != null) await app.rememberManageLink(code, token, values['full_name']?.split(' ').first ?? code);
      if (!mounted) return;
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => _Submitted(code: code, token: token)));
    } on ApiException catch (error) {
      setState(() {
        message = error.message;
        errors = error.errors;
        final first = sections.indexWhere((item) => ((item['fields'] as List?) ?? []).any((field) => errors.containsKey(field['name'])));
        if (first >= 0) step = first;
      });
      if (scroll.hasClients) scroll.jumpTo(0);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<_Picked?> _pickOne() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (sheet) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          ListTile(leading: const Icon(Icons.photo_camera_rounded), title: Text(tr('Take a photo')), onTap: () => Navigator.pop(sheet, ImageSource.camera)),
          ListTile(leading: const Icon(Icons.photo_library_rounded), title: Text(tr('Choose from gallery')), onTap: () => Navigator.pop(sheet, ImageSource.gallery)),
        ]),
      ),
    );
    if (source == null) return null;
    final file = await picker.pickImage(source: source, maxWidth: 2200, maxHeight: 2200, imageQuality: 88);
    if (file == null) return null;
    return _Picked(file.name.isEmpty ? 'photo.jpg' : file.name, await file.readAsBytes());
  }

  Future<void> _addPhotos(int remaining) async {
    final files = await picker.pickMultiImage(maxWidth: 2200, maxHeight: 2200, imageQuality: 88, limit: remaining > 1 ? remaining : null);
    final added = <_Picked>[];
    for (final file in files.take(remaining)) {
      added.add(_Picked(file.name.isEmpty ? 'photo.jpg' : file.name, await file.readAsBytes()));
    }
    setState(() => photos.addAll(added));
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.editing ? tr('Edit profile {code}', {'code': widget.code}) : tr(app.signedIn ? 'Create your biodata' : 'Submit a profile');
    return PopScope(
      canPop: step == 0,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _goTo(step - 1);
      },
      child: Scaffold(
        backgroundColor: AppColors.cream,
        appBar: AppBar(title: Text(title)),
        body: ListView(controller: scroll, padding: const EdgeInsets.fromLTRB(16, 14, 16, 30), children: [
          if (step == 0 && !widget.editing) ...[
            Tx(tr(app.signedIn ? 'Fields marked with a lock are never shown publicly.' : 'No account needed. Fields marked with a lock are never shown publicly.'), style: const TextStyle(fontSize: 13, color: AppColors.muted)),
            const SizedBox(height: 10),
          ],
          if (widget.editing) Padding(padding: const EdgeInsets.only(bottom: 12), child: Tx(tr('Editing a live profile sends it back to our team for review.'), style: const TextStyle(fontSize: 13, color: AppColors.muted))),
          Row(children: [
            for (var i = 0; i < sections.length; i++)
              Expanded(
                child: GestureDetector(
                  onTap: i < step ? () => _goTo(i) : null,
                  child: Container(height: 6, margin: const EdgeInsets.symmetric(horizontal: 2), decoration: BoxDecoration(color: i <= step ? AppColors.gold : const Color(0xFFE6DDCC), borderRadius: BorderRadius.circular(6))),
                ),
              ),
          ]),
          const SizedBox(height: 8),
          Text(tr('STEP {step} OF {total}', {'step': step + 1, 'total': sections.length}), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1, color: AppColors.bronze)),
          const SizedBox(height: 12),
          Panel(
            padding: const EdgeInsets.all(18),
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Container(
                padding: const EdgeInsets.only(bottom: 10),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.softLine))),
                child: Row(children: [
                  Expanded(child: Tx(tr('${section['title']}'), style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w700))),
                  UrduLine('${section['ur']}', size: 14),
                ]),
              ),
              for (final field in ((section['fields'] as List?) ?? []).cast<Map>()) _field(field.cast<String, dynamic>()),
              if (last) _documents(),
              if (message != null) ...[const SizedBox(height: 8), Notice(message!)],
              const SizedBox(height: 18),
              Row(children: [
                if (step > 0) ...[AppButton('Back', tone: Tone.outline, icon: Icons.arrow_back_rounded, onPressed: busy ? null : () => _goTo(step - 1)), const SizedBox(width: 10)],
                Expanded(
                  child: last
                      ? AppButton(busy ? 'Saving…' : widget.editing ? 'Save changes' : 'Submit profile', tone: Tone.gold, trailing: Icons.check_rounded, busy: busy, expand: true, onPressed: _submit)
                      : AppButton('Continue', trailing: Icons.arrow_forward_rounded, busy: busy, expand: true, onPressed: _next),
                ),
              ]),
            ]),
          ),
        ]),
      ),
    );
  }

  List<Option> _countryOptions() => ((app.config['countries'] as List?) ?? []).cast<Map>().map((country) => Option('${country['name']}', tr('${country['name']}'))).toList();

  String? _countryNameOf(String? id) {
    for (final country in ((app.config['countries'] as List?) ?? []).cast<Map>()) {
      if ('${country['id']}' == id) return '${country['name']}';
    }
    return null;
  }

  List<Option> _suggestions(String kind) {
    switch (kind) {
      case 'castes':
        return optionsFrom(app.config['castes']);
      case 'nationalities':
        return optionsFrom(app.config['nationalities']);
      case 'marriage-places':
        final names = <String>{...((app.config['marriageLocations'] as List?) ?? []).map((item) => '$item'), ..._countryOptions().map((option) => option.value)};
        return names.map(Option.new).toList();
      default:
        final country = _countryNameOf(values['country_id']);
        final seen = <String>{};
        return [
          for (final city in ((app.config['cities'] as List?) ?? []).cast<Map>())
            if ((country == null || city['country'] == country) && seen.add('${city['name']}')) Option('${city['name']}', tr('${city['name']}'), country == null ? tr('${city['country']}') : null),
        ];
    }
  }

  Widget _field(Json field) {
    final name = '${field['name']}';
    final label = '${field['label']}';
    final required = field['required'] == true;
    final locked = field['private'] == true;
    final hint = field['hint'] as String?;
    final error = errors[name];
    final value = values[name] ?? '';
    switch (field['type']) {
      case 'derived':
        final dob = DateTime.tryParse(values['date_of_birth'] ?? '');
        int? age;
        if (dob != null) {
          final now = DateTime.now();
          age = now.year - dob.year - ((now.month < dob.month || (now.month == dob.month && now.day < dob.day)) ? 1 : 0);
        }
        return FieldShell(label: 'Age', child: Container(width: double.infinity, padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: AppColors.cream, borderRadius: BorderRadius.circular(8), border: Border.all(color: const Color(0xFFDCE0DC))), child: Text(age == null ? tr('Calculated from date of birth') : '$age')));
      case 'select':
        return PickerField(label: label, required: required, locked: locked, hint: hint, error: error, options: optionsFrom(field['options']), value: value, anyLabel: required ? null : 'Not specified', placeholder: 'Select', onChanged: (picked) => _change(name, picked));
      case 'country':
        final countries = ((app.config['countries'] as List?) ?? []).cast<Map>().map((country) => Option('${country['id']}', tr('${country['name']}'))).toList();
        return PickerField(label: label, required: required, locked: locked, hint: hint, error: error, options: countries, value: value, placeholder: 'Select', onChanged: (picked) {
          _change(name, picked);
          final city = values['city'];
          final country = _countryNameOf(picked);
          if (city != null && city.isNotEmpty && country != null && ((app.config['cities'] as List?) ?? []).cast<Map>().any((item) => item['name'] == city) && !((app.config['cities'] as List?) ?? []).cast<Map>().any((item) => item['name'] == city && item['country'] == country)) {
            _change('city', '');
          }
        });
      case 'country-name':
        return PickerField(label: label, required: required, locked: locked, hint: hint, error: error, options: _countryOptions(), value: value, anyLabel: required ? null : 'Not specified', allowCustom: true, placeholder: 'Type or choose', onChanged: (picked) => _change(name, picked));
      case 'date':
        return FieldShell(
          label: label,
          required: required,
          locked: locked,
          hint: hint,
          error: error,
          child: InkWell(
            onTap: () async {
              final now = DateTime.now();
              final current = DateTime.tryParse(value);
              final picked = await showDatePicker(
                context: context,
                initialDate: current ?? DateTime(now.year - 25, 1, 1),
                firstDate: DateTime(now.year - 100),
                lastDate: now,
                initialEntryMode: DatePickerEntryMode.calendarOnly,
                helpText: tr(label),
              );
              if (picked != null) _change(name, '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}');
            },
            child: InputDecorator(
              isEmpty: value.isEmpty,
              decoration: InputDecoration(hintText: 'YYYY-MM-DD', errorText: error == null ? null : '', errorStyle: const TextStyle(height: 0, fontSize: 0), suffixIcon: const Icon(Icons.calendar_month_rounded, color: AppColors.muted)),
              child: value.isEmpty ? null : Text(formatDate(value), style: const TextStyle(fontSize: 15)),
            ),
          ),
        );
      default:
        final suggest = field['suggest'] as String?;
        if (suggest != null) {
          return PickerField(label: label, required: required, locked: locked, hint: hint, error: error, options: _suggestions(suggest), value: value, allowCustom: true, anyLabel: required ? null : 'Not specified', placeholder: field['placeholder'] as String? ?? 'Type or choose', onChanged: (picked) => _change(name, picked));
        }
        return TextInput(
          key: ValueKey('$name-$step'),
          label: label,
          required: required,
          locked: locked,
          hint: hint,
          error: error,
          initial: value,
          placeholder: field['placeholder'] as String?,
          maxLength: (field['max'] as num?)?.toInt(),
          lines: field['type'] == 'textarea' ? ((field['rows'] as num?)?.toInt() ?? 4) : 1,
          keyboard: switch (field['type']) {
            'number' => TextInputType.number,
            'email' => TextInputType.emailAddress,
            _ => field['pattern'] == 'phone' ? TextInputType.phone : null,
          },
          onChanged: (text) => _change(name, text),
        );
    }
  }

  Widget _documents() {
    final kept = widget.photos.where((photo) => !removed.contains((photo['id'] as num).toInt())).toList();
    final remaining = maxPhotos - kept.length - photos.length;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      if (kept.isNotEmpty) ...[
        Text(tr('Current photos'), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Wrap(spacing: 10, runSpacing: 10, children: [
          for (final photo in kept)
            Column(children: [
              NetImage('${photo['thumb']}', width: 88, height: 88, radius: 10),
              TextButton(onPressed: () => setState(() => removed.add((photo['id'] as num).toInt())), child: Text(tr('Remove'), style: const TextStyle(color: AppColors.red, fontSize: 12))),
            ]),
        ]),
        const SizedBox(height: 8),
      ],
      Text(tr('Profile photographs'), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
      const SizedBox(height: 6),
      Wrap(spacing: 10, runSpacing: 10, children: [
        for (final photo in photos)
          Stack(children: [
            ClipRRect(borderRadius: BorderRadius.circular(10), child: Image.memory(photo.bytes, width: 88, height: 88, fit: BoxFit.cover)),
            PositionedDirectional(end: 2, top: 2, child: InkWell(onTap: () => setState(() => photos.remove(photo)), child: Container(decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle), child: const Icon(Icons.close_rounded, size: 18, color: AppColors.red)))),
          ]),
        if (remaining > 0)
          Semantics(
            button: true,
            label: tr('Add photos'),
            child: InkWell(
              onTap: () => _addPhotos(remaining),
              child: Container(width: 88, height: 88, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.line)), child: const Icon(Icons.add_a_photo_rounded, color: AppColors.gold)),
            ),
          ),
      ]),
      const SizedBox(height: 6),
      Tx(tr('JPG, PNG or WebP, up to 8 MB each. You can add {count} more.', {'count': remaining < 0 ? 0 : remaining}), style: const TextStyle(fontSize: 12, color: AppColors.muted)),
      CheckboxListTile(
        contentPadding: EdgeInsets.zero,
        controlAffinity: ListTileControlAffinity.leading,
        value: !showPhoto,
        onChanged: (checked) => setState(() => showPhoto = !(checked ?? false)),
        title: Tx(tr('Keep my photo private. It will only be shared through the bureau.'), style: const TextStyle(fontSize: 13)),
      ),
      Container(
        padding: const EdgeInsets.all(16),
        margin: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(color: AppColors.sand, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.sandLine)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Row(children: [const Icon(Icons.verified_rounded, color: AppColors.verified, size: 18), const SizedBox(width: 6), Expanded(child: Text(tr('Get the blue verified tick (optional)'), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)))]),
          const SizedBox(height: 6),
          Tx(tr('Upload your CNIC so our team can verify this profile. It is encrypted, never shown publicly, and only administrators can open it.'), style: const TextStyle(fontSize: 12.5, color: AppColors.muted, height: 1.5)),
          if (widget.verification == 'verified') Padding(padding: const EdgeInsets.only(top: 8), child: Text(tr('This profile is verified. Uploading a new CNIC restarts the review.'), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.green))),
          if (widget.verification == 'pending') Padding(padding: const EdgeInsets.only(top: 8), child: Text(tr('Your CNIC is waiting for review.'), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.goldText))),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: _cnicButton('CNIC front', front, (file) => setState(() => front = file))),
            const SizedBox(width: 10),
            Expanded(child: _cnicButton('CNIC back', back, (file) => setState(() => back = file))),
          ]),
        ]),
      ),
      if (!widget.editing)
        CheckboxListTile(
          contentPadding: EdgeInsets.zero,
          controlAffinity: ListTileControlAffinity.leading,
          value: consent,
          onChanged: (checked) => setState(() => consent = checked ?? false),
          title: Tx('${tr('I confirm this information is true, the person concerned is an adult and has agreed to this profile, and I accept the')} ${tr('privacy policy')} ${tr('and')} ${tr('terms')}.', style: const TextStyle(fontSize: 12.5, height: 1.5)),
          subtitle: Row(children: [
            TextButton(onPressed: () => push(context, const LegalScreen(kind: 'privacy')), child: Text(tr('privacy policy'))),
            TextButton(onPressed: () => push(context, const LegalScreen(kind: 'terms')), child: Text(tr('terms'))),
          ]),
        ),
    ]);
  }

  Widget _cnicButton(String label, _Picked? file, ValueChanged<_Picked?> onPicked) {
    return Semantics(button: true, label: tr(label), child: InkWell(
      onTap: () async {
        final picked = await _pickOne();
        if (picked != null) onPicked(picked);
      },
      child: Container(
        height: 96,
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.line)),
        clipBehavior: Clip.antiAlias,
        child: file == null
            ? Column(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(Icons.badge_rounded, color: AppColors.gold), const SizedBox(height: 4), Text(tr(label), style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600)), Text(tr('Clear photo or scan.'), style: const TextStyle(fontSize: 10.5, color: AppColors.muted))])
            : Stack(fit: StackFit.expand, children: [Image.memory(file.bytes, fit: BoxFit.cover), PositionedDirectional(end: 4, top: 4, child: InkWell(onTap: () => onPicked(null), child: Container(decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle), child: const Icon(Icons.close_rounded, size: 18, color: AppColors.red))))]),
      ),
    ));
  }
}

/// After a submission: the profile code, and for visitors the private link the app keeps for them.
class _Submitted extends StatelessWidget {
  const _Submitted({required this.code, this.token});
  final String code;
  final String? token;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: AppBar(title: Text(code)),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Panel(
          child: Column(children: [
            const Icon(Icons.check_circle_rounded, color: AppColors.green, size: 56),
            const SizedBox(height: 10),
            Text(tr('Profile $code received'), textAlign: TextAlign.center, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
            const SizedBox(height: 6),
            Tx(tr('Our team will review it shortly.'), textAlign: TextAlign.center, style: const TextStyle(color: AppColors.muted)),
            if (token != null) ...[
              const SizedBox(height: 14),
              Tx(tr('Keep this page’s link private: it is how you view, edit and download this profile. We have also emailed it to you.'), textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, height: 1.5)),
            ],
            const SizedBox(height: 18),
            AppButton('View my profile', expand: true, onPressed: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => token != null ? ManageScreen(token: token!) : MyProfileScreen(code: code)))),
            if (token != null && !app.signedIn) ...[
              const SizedBox(height: 10),
              AppButton('Create account', tone: Tone.outline, expand: true, onPressed: () => push(context, RegisterScreen(claim: token))),
              const SizedBox(height: 6),
              Tx(tr('Create an account from here and this profile is added to it automatically.'), textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: AppColors.muted)),
            ],
          ]),
        ),
      ]),
    );
  }
}
