import 'package:flutter/material.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../core/theme.dart';
import 'common.dart';
import 'pickers.dart';

/// The website's "A little about your enquiry" form. It is sent to the bureau's admin panel.
class EnquiryForm extends StatefulWidget {
  const EnquiryForm({super.key, this.profileCode});
  final String? profileCode;

  @override
  State<EnquiryForm> createState() => _EnquiryFormState();
}

class _EnquiryFormState extends State<EnquiryForm> {
  static const profileFor = ['Myself', 'My son', 'My daughter', 'My sibling', 'Another family member'];
  final name = TextEditingController();
  final phone = TextEditingController();
  final city = TextEditingController();
  final message = TextEditingController();
  String forWhom = profileFor.first;
  bool busy = false;
  String? result;
  bool ok = false;

  Future<void> _send() async {
    FocusScope.of(context).unfocus();
    setState(() { busy = true; result = null; });
    try {
      final data = await app.api.post('enquiry', {
        'name': name.text, 'phone': phone.text, 'profile_for': forWhom, 'city': city.text, 'message': message.text,
        if (widget.profileCode != null) 'profile_code': widget.profileCode,
      });
      ok = true;
      result = '${data['message']}';
      name.clear(); phone.clear(); city.clear(); message.clear();
    } on ApiException catch (error) {
      ok = false;
      result = error.message;
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Widget _label(IconData icon, String text, String urdu) => Row(children: [
        Icon(icon, size: 14, color: const Color(0xFFA37A2C)),
        const SizedBox(width: 6),
        Expanded(child: Text(tr(text), style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600))),
        Text(urdu, textDirection: TextDirection.rtl, style: const TextStyle(fontFamily: 'NotoNastaliqUrdu', fontSize: 11, height: 1.9, color: Color(0xFF7E6C48))),
      ]);

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        const Icon(Icons.edit_note_rounded, color: Color(0xFFA9802C)),
        const SizedBox(width: 8),
        Expanded(child: Text(tr('A little about your enquiry'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700))),
      ]),
      const SizedBox(height: 14),
      _label(Icons.person_rounded, 'Your name *', 'آپ کا نام'),
      const SizedBox(height: 6),
      TextField(controller: name, maxLength: 100, autofillHints: const [AutofillHints.name], decoration: InputDecoration(hintText: tr('Enter your full name'), counterText: '')),
      const SizedBox(height: 12),
      _label(Icons.phone_rounded, 'Phone / WhatsApp *', 'موبائل نمبر'),
      const SizedBox(height: 6),
      TextField(controller: phone, keyboardType: TextInputType.phone, maxLength: 20, autofillHints: const [AutofillHints.telephoneNumber], decoration: const InputDecoration(hintText: '0300 1234567', counterText: '')),
      const SizedBox(height: 12),
      _label(Icons.family_restroom_rounded, 'Profile for', 'رشتہ کس کے لیے؟'),
      const SizedBox(height: 6),
      PickerField(label: 'Profile for', options: profileFor.map(Option.new).toList(), value: forWhom, onChanged: (value) => setState(() => forWhom = value.isEmpty ? profileFor.first : value)),
      _label(Icons.location_on_rounded, 'Your city', 'آپ کا شہر'),
      const SizedBox(height: 6),
      TextField(controller: city, maxLength: 100, decoration: InputDecoration(hintText: tr('e.g. Multan'), counterText: '')),
      const SizedBox(height: 12),
      _label(Icons.message_rounded, 'How can we help?', 'ہم کیسے مدد کر سکتے ہیں؟'),
      const SizedBox(height: 6),
      TextField(controller: message, maxLength: 1500, minLines: 3, maxLines: 6, decoration: InputDecoration(hintText: tr('Share your preferences with us…'), counterText: '')),
      const SizedBox(height: 16),
      AppButton(busy ? 'Sending…' : 'Send your enquiry', icon: Icons.send_rounded, expand: true, busy: busy, onPressed: _send),
      const SizedBox(height: 10),
      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Icon(Icons.info_outline_rounded, size: 14, color: AppColors.muted),
        const SizedBox(width: 6),
        Expanded(child: Tx(tr('Our team will contact you on the number you share.'), style: const TextStyle(fontSize: 12, color: AppColors.muted))),
      ]),
      if (result != null) ...[const SizedBox(height: 12), Notice(result!, ok: ok)],
    ]);
  }
}
