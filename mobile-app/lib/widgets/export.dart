import 'dart:typed_data';
import 'dart:ui' as ui;

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
      AppButton('Download image', small: true, tone: Tone.gold, icon: Icons.image_rounded, onPressed: preview),
      AppButton('Download PDF', small: true, tone: Tone.gold, icon: Icons.picture_as_pdf_rounded, onPressed: preview),
      AppButton('Share', small: true, tone: Tone.outline, icon: Icons.share_rounded, onPressed: () => SharePlus.instance.share(ShareParams(text: copy, subject: 'Al Zaujain ${data['code']}'))),
    ]);
  }
}

/// Shows the printable biodata sheet, then shares it as a PNG image or an A4 PDF.
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
  final boundary = GlobalKey();
  String? busy;

  static const sheetWidth = 620.0;

  Future<ui.Image> _render() async {
    await Future<void>.delayed(const Duration(milliseconds: 250));
    final render = boundary.currentContext!.findRenderObject() as RenderRepaintBoundary;
    return render.toImage(pixelRatio: 2);
  }

  Future<Uint8List> _png(ui.Image image) async => (await image.toByteData(format: ui.ImageByteFormat.png))!.buffer.asUint8List();

  Future<void> _share(String kind) async {
    setState(() => busy = kind);
    try {
      final image = await _render();
      final code = widget.data['code'];
      XFile file;
      if (kind == 'image') {
        file = XFile.fromData(await _png(image), mimeType: 'image/png', name: 'al-zaujain-$code.png');
      } else {
        file = XFile.fromData(await _pdf(image), mimeType: 'application/pdf', name: 'al-zaujain-$code.pdf');
      }
      await SharePlus.instance.share(ShareParams(files: [file], fileNameOverrides: [file.name], subject: 'Al Zaujain $code'));
    } catch (_) {
      if (mounted) showMessage(context, kind == 'image' ? 'The image could not be created. Please try again.' : 'The PDF could not be created. Please try again.', error: true);
    } finally {
      if (mounted) setState(() => busy = null);
    }
  }

  /// Cuts the sheet into A4 pages, like the website's PDF download.
  Future<Uint8List> _pdf(ui.Image image) async {
    final pdf = pw.Document(title: 'Al Zaujain ${widget.data['code']}');
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
    return pdf.save();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFE9E4DA),
      appBar: AppBar(title: Text(tr('Share biodata'))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(12),
        child: LayoutBuilder(builder: (context, size) {
          return Center(
            child: SizedBox(
              width: size.maxWidth,
              child: FittedBox(
                fit: BoxFit.fitWidth,
                alignment: Alignment.topCenter,
                child: RepaintBoundary(key: boundary, child: SizedBox(width: sheetWidth, child: ExportSheet(data: widget.data, subtitle: widget.subtitle, photo: widget.photo))),
              ),
            ),
          );
        }),
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
          child: Row(children: [
            Expanded(child: AppButton('Copy', tone: Tone.outline, icon: Icons.copy_rounded, small: true, onPressed: () => copyText(context, widget.text, 'Complete profile copied to your clipboard.'))),
            const SizedBox(width: 8),
            Expanded(child: AppButton(busy == 'image' ? 'Creating…' : 'Image', tone: Tone.gold, icon: Icons.image_rounded, small: true, busy: busy == 'image', onPressed: busy == null ? () => _share('image') : null)),
            const SizedBox(width: 8),
            Expanded(child: AppButton(busy == 'pdf' ? 'Creating…' : 'PDF', tone: Tone.gold, icon: Icons.picture_as_pdf_rounded, small: true, busy: busy == 'pdf', onPressed: busy == null ? () => _share('pdf') : null)),
          ]),
        ),
      ),
    );
  }
}

/// The printable biodata, like the website's ExportSheet.
class ExportSheet extends StatelessWidget {
  const ExportSheet({super.key, required this.data, this.subtitle = const [], this.photo});
  final Json data;
  final List<String> subtitle;
  final String? photo;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        BiodataHeader(data: data),
        Padding(
          padding: const EdgeInsets.all(24),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            if (photo != null) Padding(padding: const EdgeInsetsDirectional.only(end: 18), child: NetImage(photo, width: 150, height: 150, radius: 14)),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [Flexible(child: Tx('${data['name']}', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w700))), if (data['verified'] == true) const Padding(padding: EdgeInsetsDirectional.only(start: 6), child: VerifiedBadge(size: 20))]),
                Tx(subtitle.where((part) => part.isNotEmpty).map(tr).join(' · '), style: const TextStyle(fontSize: 13, color: AppColors.muted)),
              ]),
            ),
          ]),
        ),
        Padding(padding: const EdgeInsets.fromLTRB(24, 0, 24, 18), child: CandidateSection(data: data)),
        PartnerSection(data: data),
        Container(
          color: AppColors.navy,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          child: Row(children: [
            Expanded(child: Text('${tr('Al Zaujain International Marriage Consultancy')} · ${app.site['site_phone'] ?? ''}', style: const TextStyle(color: AppColors.champagne, fontSize: 11))),
            Text(formatDate(DateTime.now().toIso8601String()), style: const TextStyle(color: Colors.white, fontSize: 11)),
          ]),
        ),
      ]),
    );
  }
}
