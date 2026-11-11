import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:archive/archive.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:share_plus/share_plus.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../core/theme.dart';
import 'biodata.dart';
import 'common.dart';

/// The same plain-text biodata as the website's "Copy profile" (lib/profile-schema.js biodataToText).
String biodataText(Json data) {
  final lines = <String>['AL ZAUJAIN | ${tr('International Marriage Consultancy')}', '${tr('Profile')} ${data['code']}', ''];
  if (data['headline'] != null && '${data['headline']}'.isNotEmpty) lines.addAll(['${data['headline']}', '']);
  void block(String title, List<Json> rows) {
    if (rows.isEmpty) return;
    lines.add(tr(title));
    for (final row in rows) {
      lines.add('${tr('${row['label']}')}: ${tr(valueText(row['value']))}');
    }
    lines.add('');
  }

  void paragraph(String title, Object? text) {
    if (text != null && '$text'.isNotEmpty) lines.addAll([tr(title), '$text', '']);
  }

  final partner = ((data['partner'] as Map?) ?? const {}).cast<String, dynamic>();
  block('CANDIDATE INFORMATION', rowsOf(data['candidate']));
  block('RESIDENCE', rowsOf(data['residence']));
  block('FAMILY DETAILS', rowsOf(data['family']));
  paragraph('FAMILY BACKGROUND', data['familyBackground']);
  paragraph('ABOUT THE CANDIDATE', data['about']);
  paragraph('رشتے کی ضروریات / PARTNER REQUIREMENTS', partner['demand']);
  block('PREFERRED PARTNER', rowsOf(partner['rows']));
  block('CONTACT', rowsOf(data['contact']));
  return lines.join('\n').trim();
}

/// Copy, image and PDF, as under every biodata on the website.
class BiodataActions extends StatelessWidget {
  const BiodataActions({super.key, required this.data, this.subtitle = const [], this.photo, this.text, this.private = false});
  final Json data;
  final List<String> subtitle;
  final String? photo;
  final String? text;
  final bool private;

  @override
  Widget build(BuildContext context) {
    final copy = text ?? biodataText(data);
    void preview() => push(context, BiodataPreview(data: data, subtitle: subtitle, photo: photo, text: copy));
    return Wrap(spacing: 10, runSpacing: 10, children: [
      AppButton(private ? 'Copy complete profile' : 'Copy profile', small: true, icon: Icons.copy_rounded, onPressed: () => copyText(context, copy, 'Complete profile copied to your clipboard.')),
      AppButton('Download images (ZIP)', small: true, tone: Tone.gold, icon: Icons.folder_zip_rounded, onPressed: preview),
      AppButton('Download PDF', small: true, tone: Tone.gold, icon: Icons.picture_as_pdf_rounded, onPressed: preview),
      AppButton('Share', small: true, tone: Tone.outline, icon: Icons.share_rounded, onPressed: () => SharePlus.instance.share(ShareParams(text: copy, subject: 'Al Zaujain ${data['code']}'))),
    ]);
  }
}

/// Education and work rows go in their own part; the rest of section A is personal information.
final _educationLabel = RegExp(r'educat|qualif|degree|work|profession|occupation|job|business|employ|income|institut', caseSensitive: false);

/// One part of the biodata export: a title for the file name and what it shows.
class _Part {
  const _Part(this.file, this.title, this.ur, this.body);
  final String file;
  final String title;
  final String ur;
  final Widget body;
}

/// Shows the biodata as separate parts (profile, personal, education, residence, family, about,
/// contact, partner requirements) and shares them as a ZIP of images, or as an A4 PDF with each part
/// on its own page. Separate parts keep every picture a sensible size for a phone screen.
class BiodataPreview extends StatefulWidget {
  const BiodataPreview({super.key, required this.data, required this.subtitle, this.photo, required this.text});
  final Json data;
  final List<String> subtitle;
  final String? photo;
  final String text;

  @override
  State<BiodataPreview> createState() => _BiodataPreviewState();
}

class _BiodataPreviewState extends State<BiodataPreview> {
  String? busy;
  late final List<_Part> parts = _parts();
  late final List<GlobalKey> keys = [for (final _ in parts) GlobalKey()];

  static const sheetWidth = 560.0;

  List<_Part> _parts() {
    final data = widget.data;
    final candidate = rowsOf(data['candidate']);
    final personal = candidate.where((row) => !_educationLabel.hasMatch('${row['label']}')).toList();
    final education = candidate.where((row) => _educationLabel.hasMatch('${row['label']}')).toList();
    final residence = rowsOf(data['residence']);
    final family = rowsOf(data['family']);
    final contact = rowsOf(data['contact']);
    final partner = ((data['partner'] as Map?) ?? const {}).cast<String, dynamic>();
    final partnerRows = rowsOf(partner['rows']);
    String? text(Object? value) => value == null || '$value'.trim().isEmpty ? null : '$value';
    return [
      _Part('1-profile', 'Profile', 'پروفائل', _ProfileIntro(data: data, subtitle: widget.subtitle, photo: widget.photo)),
      if (personal.isNotEmpty) _Part('2-personal-information', 'Personal Information', 'ذاتی معلومات', _PartRows(personal)),
      if (education.isNotEmpty) _Part('3-education-and-profession', 'Education & Profession', 'تعلیم اور پیشہ', _PartRows(education)),
      if (residence.isNotEmpty) _Part('4-residence', 'Residence', 'رہائش', _PartRows(residence)),
      if (family.isNotEmpty || text(data['familyBackground']) != null)
        _Part('5-family', 'Family Details', 'خاندانی تفصیلات', Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          if (family.isNotEmpty) _PartRows(family),
          if (text(data['familyBackground']) != null) _Paragraph(title: 'Family background', text: text(data['familyBackground'])!),
        ])),
      if (text(data['about']) != null) _Part('6-about', 'About The Candidate', 'امیدوار کے بارے میں', _Paragraph(text: text(data['about'])!)),
      if (contact.isNotEmpty) _Part('7-contact', 'Private Contact Details', 'رابطے کی تفصیلات', _PartRows(contact)),
      if (text(partner['demand']) != null || partnerRows.isNotEmpty)
        _Part('8-partner-requirements', 'Partner Requirements', 'رشتے کی ضروریات', Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          if (text(partner['demand']) != null) _Paragraph(text: text(partner['demand'])!, boxed: true),
          if (partnerRows.isNotEmpty) _PartRows(partnerRows),
        ])),
    ];
  }

  Future<ui.Image> _capture(GlobalKey key) async {
    final render = key.currentContext!.findRenderObject() as RenderRepaintBoundary;
    // Phones cannot make a picture beyond their graphics limit (often 4096 pixels): stay inside it.
    final size = render.size;
    final ratio = [2.0, 4000 / size.height, 4000 / size.width].reduce((a, b) => a < b ? a : b);
    return render.toImage(pixelRatio: ratio);
  }

  Future<Uint8List> _png(ui.Image image) async => (await image.toByteData(format: ui.ImageByteFormat.png))!.buffer.asUint8List();

  Future<void> _share(String kind) async {
    setState(() => busy = kind);
    try {
      await Future<void>.delayed(const Duration(milliseconds: 250));
      final code = '${widget.data['code']}';
      final images = <ui.Image>[];
      for (final key in keys) {
        images.add(await _capture(key));
      }
      final zip = kind == 'zip';
      final Uint8List bytes;
      if (zip) {
        final archive = Archive();
        for (var i = 0; i < parts.length; i++) {
          archive.addFile(ArchiveFile.bytes('al-zaujain-$code-${parts[i].file}.png', await _png(images[i])));
        }
        bytes = Uint8List.fromList(ZipEncoder().encode(archive));
      } else {
        bytes = await _pdf(images);
      }
      // Saved as a real, named file first: handing raw bytes to the share sheet fails on Android.
      final folder = await Directory('${Directory.systemTemp.path}/biodata').create(recursive: true);
      final name = 'al-zaujain-$code.${zip ? 'zip' : 'pdf'}';
      final path = '${folder.path}/$name';
      await File(path).writeAsBytes(bytes, flush: true);
      await SharePlus.instance.share(ShareParams(files: [XFile(path, mimeType: zip ? 'application/zip' : 'application/pdf', name: name)], subject: 'Al Zaujain $code'));
    } catch (error, stack) {
      debugPrint('Biodata $kind failed: $error\n$stack');
      if (mounted) showMessage(context, kind == 'zip' ? 'The images could not be created. Please try again.' : 'The PDF could not be created. Please try again.', error: true);
    } finally {
      if (mounted) setState(() => busy = null);
    }
  }

  /// Each part starts on a new A4 page; a part longer than a page is cut and continues on the next one.
  Future<Uint8List> _pdf(List<ui.Image> images) async {
    final pdf = pw.Document(title: 'Al Zaujain ${widget.data['code']}');
    for (final image in images) {
      final pageHeight = (image.width * 297 / 210).floor();
      for (var top = 0; top < image.height; top += pageHeight) {
        final height = (image.height - top).clamp(1, pageHeight);
        final recorder = ui.PictureRecorder();
        final canvas = Canvas(recorder);
        canvas.drawRect(Rect.fromLTWH(0, 0, image.width.toDouble(), height.toDouble()), Paint()..color = Colors.white);
        canvas.drawImageRect(image, Rect.fromLTWH(0, top.toDouble(), image.width.toDouble(), height.toDouble()), Rect.fromLTWH(0, 0, image.width.toDouble(), height.toDouble()), Paint());
        final slice = await recorder.endRecording().toImage(image.width, height);
        final bytes = await _png(slice);
        pdf.addPage(pw.Page(pageFormat: PdfPageFormat.a4, margin: pw.EdgeInsets.zero, build: (_) => pw.Align(alignment: pw.Alignment.topCenter, child: pw.Image(pw.MemoryImage(bytes), fit: pw.BoxFit.fitWidth))));
      }
    }
    return pdf.save();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFE9E4DA),
      appBar: AppBar(title: Text(tr('Share biodata'))),
      // Every part is laid out and painted (not built lazily), so each one can be captured.
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(12),
        child: LayoutBuilder(
          builder: (context, size) => Column(children: [
            for (var i = 0; i < parts.length; i++)
              Padding(
                padding: EdgeInsets.only(bottom: i == parts.length - 1 ? 0 : 14),
                child: SizedBox(
                  width: size.maxWidth,
                  child: FittedBox(
                    fit: BoxFit.fitWidth,
                    alignment: Alignment.topCenter,
                    child: RepaintBoundary(key: keys[i], child: SizedBox(width: sheetWidth, child: _PartSheet(data: widget.data, part: parts[i], index: i + 1, total: parts.length))),
                  ),
                ),
              ),
          ]),
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
          child: Row(children: [
            Expanded(child: AppButton('Copy', tone: Tone.outline, icon: Icons.copy_rounded, small: true, onPressed: () => copyText(context, widget.text, 'Complete profile copied to your clipboard.'))),
            const SizedBox(width: 8),
            Expanded(child: AppButton(busy == 'zip' ? 'Creating…' : 'ZIP', tone: Tone.gold, icon: Icons.folder_zip_rounded, small: true, busy: busy == 'zip', onPressed: busy == null ? () => _share('zip') : null)),
            const SizedBox(width: 8),
            Expanded(child: AppButton(busy == 'pdf' ? 'Creating…' : 'PDF', tone: Tone.gold, icon: Icons.picture_as_pdf_rounded, small: true, busy: busy == 'pdf', onPressed: busy == null ? () => _share('pdf') : null)),
          ]),
        ),
      ),
    );
  }
}

/// One exported picture: the brand band with the Profile ID, the part's title, its content and the footer.
class _PartSheet extends StatelessWidget {
  const _PartSheet({required this.data, required this.part, required this.index, required this.total});
  final Json data;
  final _Part part;
  final int index;
  final int total;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        BiodataHeader(data: data),
        Padding(
          padding: const EdgeInsets.fromLTRB(22, 18, 22, 6),
          child: Row(children: [
            Container(width: 30, height: 30, alignment: Alignment.center, decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: AppColors.gold)), child: Text('$index', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.deepGold))),
            const SizedBox(width: 10),
            Expanded(child: Text(tr(part.title), style: TextStyle(fontFamily: headFont, fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.navy))),
            if (!app.t.isUrdu) UrduLine(part.ur, size: 13),
          ]),
        ),
        const Padding(padding: EdgeInsets.symmetric(horizontal: 22), child: Divider(height: 1, color: AppColors.softLine)),
        Padding(padding: const EdgeInsets.fromLTRB(22, 8, 22, 20), child: part.body),
        Container(
          color: AppColors.navy,
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 11),
          child: Row(children: [
            Expanded(child: Text('${tr('Trusted matchmaking for a better future.')} · ${app.site['site_phone'] ?? ''}', style: const TextStyle(color: AppColors.champagne, fontSize: 10.5))),
            Text('$index / $total', style: const TextStyle(color: Colors.white, fontSize: 10.5)),
          ]),
        ),
      ]),
    );
  }
}

/// The first part: photo, name, place and the highlight tiles.
class _ProfileIntro extends StatelessWidget {
  const _ProfileIntro({required this.data, required this.subtitle, this.photo});
  final Json data;
  final List<String> subtitle;
  final String? photo;

  @override
  Widget build(BuildContext context) {
    final highlights = rowsOf(data['highlights']).where((item) => item['value'] != null && '${item['value']}'.isNotEmpty).toList();
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      const SizedBox(height: 8),
      Row(children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: photo != null
              ? NetImage(photo, width: 170, height: 170)
              : Container(width: 170, height: 170, color: const Color(0xFFE9E1D1), padding: const EdgeInsets.all(32), child: Opacity(opacity: 0.7, child: Image.asset('assets/images/logo.png'))),
        ),
        const SizedBox(width: 20),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [Flexible(child: Tx(titleCase('${data['name']}'), style: TextStyle(fontFamily: headFont, fontSize: 26, fontWeight: FontWeight.w700, color: AppColors.navy))), if (data['verified'] == true) const Padding(padding: EdgeInsetsDirectional.only(start: 8), child: VerifiedBadge(size: 19))]),
            const SizedBox(height: 4),
            Tx(titleCase(subtitle.where((part) => part.isNotEmpty).map(tr).join(' · ')), style: const TextStyle(fontSize: 13, color: AppColors.muted)),
            if (!app.t.isUrdu) Text('رشتے محبت کے، فیصلے اپنوں کے', textDirection: TextDirection.rtl, style: urduStyle.copyWith(fontSize: 14, color: const Color(0xFF9B712B))),
          ]),
        ),
      ]),
      if (highlights.isNotEmpty) ...[
        const SizedBox(height: 16),
        LayoutBuilder(builder: (context, size) {
          final width = (size.maxWidth - 10) / 2;
          return Wrap(spacing: 10, runSpacing: 10, children: [
            for (final item in highlights)
              Container(
                width: width,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(color: const Color(0xFFFBF8F1), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFECE4D4))),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(tr('${item['label']}'), style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                  Tx(tr(valueText(item['value'])), maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontFamily: headFont, fontSize: 16, fontWeight: FontWeight.w800, height: 1.25)),
                ]),
              ),
          ]);
        }),
      ],
    ]);
  }
}

/// Rows of a part, two to a line: each heading above its value, like the profile page.
class _PartRows extends StatelessWidget {
  const _PartRows(this.rows);
  final List<Json> rows;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, size) {
      final width = (size.maxWidth - 20) / 2;
      return Wrap(spacing: 20, children: [
        for (final row in rows)
          Container(
            width: width,
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFE9E2D4)))),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(tr('${row['label']}'), style: TextStyle(fontFamily: headFont, fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF8A6A2C))),
              const SizedBox(height: 3),
              Tx(tr(valueText(row['value'])), style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w600, color: AppColors.navy, height: 1.3)),
            ]),
          ),
      ]);
    });
  }
}

/// A paragraph (family background, about, partner requirements), in Urdu or English.
class _Paragraph extends StatelessWidget {
  const _Paragraph({this.title, required this.text, this.boxed = false});
  final String? title;
  final String text;
  final bool boxed;

  @override
  Widget build(BuildContext context) {
    final body = Tx(text, style: const TextStyle(fontSize: 14.5, height: 1.7, color: Color(0xFF34495E)));
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (title != null) Padding(padding: const EdgeInsets.only(bottom: 6), child: Text(tr(title!).toUpperCase(), style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, letterSpacing: 1.4, color: AppColors.bronze))),
        if (boxed)
          Container(width: double.infinity, padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: const Color(0xFFFBF8F1), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFECE4D4))), child: body)
        else
          body,
      ]),
    );
  }
}
