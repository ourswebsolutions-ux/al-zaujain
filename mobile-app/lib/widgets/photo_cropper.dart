import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/theme.dart';
import 'common.dart';

/// The part of a photo chosen for proposal cards, as fractions of the photo (0–1), exactly as the
/// website's cropper sends it.
typedef Crop = Map<String, double>;

String cropJson(Crop crop) => '{"x":${crop['x']},"y":${crop['y']},"w":${crop['w']},"h":${crop['h']}}';

/// Opens the cropper: drag the photo inside the circle and pinch or use the slider to zoom, like
/// setting a WhatsApp picture. Returns the crop, or null when cancelled.
Future<Crop?> cropPhoto(BuildContext context, ImageProvider image, {Crop? initial}) {
  return Navigator.of(context).push<Crop>(MaterialPageRoute(fullscreenDialog: true, builder: (_) => _CropScreen(image: image, initial: initial)));
}

class _CropScreen extends StatefulWidget {
  const _CropScreen({required this.image, this.initial});
  final ImageProvider image;
  final Crop? initial;

  @override
  State<_CropScreen> createState() => _CropScreenState();
}

class _CropScreenState extends State<_CropScreen> {
  static const maxZoom = 4.0;
  Size? size;
  double zoom = 1;
  Offset offset = Offset.zero;
  double stage = 300;
  double startZoom = 1;
  Offset startFocal = Offset.zero;
  Offset startOffset = Offset.zero;
  ImageStream? stream;
  ImageStreamListener? listener;

  @override
  void initState() {
    super.initState();
    stream = widget.image.resolve(const ImageConfiguration());
    listener = ImageStreamListener((info, _) {
      if (!mounted || size != null) return;
      setState(() => size = Size(info.image.width.toDouble(), info.image.height.toDouble()));
      WidgetsBinding.instance.addPostFrameCallback((_) => _place());
    });
    stream!.addListener(listener!);
  }

  @override
  void dispose() {
    if (listener != null) stream?.removeListener(listener!);
    super.dispose();
  }

  double get base => size == null ? 1 : stage / math.min(size!.width, size!.height);
  Size get shown => size == null ? Size(stage, stage) : Size(size!.width * base * zoom, size!.height * base * zoom);

  Offset _clamp(Offset next, [Size? dims]) {
    final d = dims ?? shown;
    return Offset(next.dx.clamp(stage - d.width, 0.0), next.dy.clamp(stage - d.height, 0.0));
  }

  void _place() {
    if (size == null) return;
    final crop = widget.initial;
    setState(() {
      if (crop != null) {
        zoom = (stage / (crop['w']! * size!.width * base)).clamp(1.0, maxZoom);
        offset = _clamp(Offset(-crop['x']! * shown.width, -crop['y']! * shown.height));
      } else {
        // Centred across, near the top, where faces usually are.
        offset = _clamp(Offset((stage - shown.width) / 2, -(shown.height - stage) * 0.2));
      }
    });
  }

  void _zoomTo(double value) {
    if (size == null) return;
    final next = value.clamp(1.0, maxZoom);
    final cx = (stage / 2 - offset.dx) / shown.width;
    final cy = (stage / 2 - offset.dy) / shown.height;
    final dims = Size(size!.width * base * next, size!.height * base * next);
    setState(() {
      zoom = next;
      offset = _clamp(Offset(stage / 2 - cx * dims.width, stage / 2 - cy * dims.height), dims);
    });
  }

  @override
  Widget build(BuildContext context) {
    stage = math.min(340, MediaQuery.of(context).size.width - 48);
    return Scaffold(
      backgroundColor: const Color(0xFF101820),
      appBar: AppBar(backgroundColor: const Color(0xFF101820), title: Text(tr('Adjust card photo'))),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(children: [
            Tx(tr('Drag the photo and zoom so the face sits inside the circle. This is how it appears on proposal cards; the full photo stays on the profile.'), textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFFC7D3DD), fontSize: 13.5, height: 1.5)),
            const SizedBox(height: 20),
            GestureDetector(
              onScaleStart: (details) {
                startZoom = zoom;
                startFocal = details.localFocalPoint;
                startOffset = offset;
              },
              onScaleUpdate: (details) {
                if (size == null) return;
                if (details.pointerCount > 1) {
                  _zoomTo(startZoom * details.scale);
                } else {
                  setState(() => offset = _clamp(startOffset + details.localFocalPoint - startFocal));
                }
              },
              onScaleEnd: (_) {
                startOffset = offset;
              },
              child: SizedBox(
                width: stage,
                height: stage,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Stack(children: [
                    if (size != null)
                      Positioned(left: offset.dx, top: offset.dy, width: shown.width, height: shown.height, child: Image(image: widget.image, fit: BoxFit.fill, gaplessPlayback: true))
                    else
                      const Center(child: CircularProgressIndicator()),
                    Positioned.fill(child: IgnorePointer(child: CustomPaint(painter: _CirclePainter()))),
                  ]),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(children: [
              IconButton(onPressed: () => _zoomTo(zoom - 0.25), tooltip: tr('Zoom out'), icon: const Icon(Icons.zoom_out_rounded, color: Colors.white)),
              Expanded(child: Slider(value: zoom, min: 1, max: maxZoom, activeColor: AppColors.gold, onChanged: _zoomTo)),
              IconButton(onPressed: () => _zoomTo(zoom + 0.25), tooltip: tr('Zoom in'), icon: const Icon(Icons.zoom_in_rounded, color: Colors.white)),
            ]),
            const SizedBox(height: 14),
            AppButton('Use this photo', tone: Tone.gold, icon: Icons.check_rounded, expand: true, onPressed: size == null
                ? null
                : () => Navigator.pop(context, <String, double>{
                      'x': -offset.dx / shown.width,
                      'y': -offset.dy / shown.height,
                      'w': stage / shown.width,
                      'h': stage / shown.height,
                    })),
            TextButton(onPressed: () => Navigator.pop(context), child: Text(tr('Cancel'), style: const TextStyle(color: Color(0xFFC7D3DD)))),
          ]),
        ),
      ),
    );
  }
}

/// Darkens everything outside the circle, like a WhatsApp picture.
class _CirclePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final circle = Rect.fromCircle(center: rect.center, radius: size.shortestSide / 2);
    canvas.drawPath(Path()..fillType = PathFillType.evenOdd..addRect(rect)..addOval(circle), Paint()..color = const Color(0x9903223F));
    canvas.drawOval(circle, Paint()..style = PaintingStyle.stroke..strokeWidth = 2..color = Colors.white.withValues(alpha: 0.9));
  }

  @override
  bool shouldRepaint(_CirclePainter oldDelegate) => false;
}

/// A round preview of the chosen part of a photo.
class CropPreview extends StatelessWidget {
  const CropPreview({super.key, required this.image, this.crop, this.size = 88});
  final ImageProvider image;
  final Crop? crop;
  final double size;

  @override
  Widget build(BuildContext context) {
    final c = crop;
    return ClipOval(
      child: SizedBox(
        width: size,
        height: size,
        child: c == null
            ? Image(image: image, fit: BoxFit.cover)
            : Stack(children: [
                Positioned(left: -c['x']! * size / c['w']!, top: -c['y']! * size / c['h']!, width: size / c['w']!, height: size / c['h']!, child: Image(image: image, fit: BoxFit.fill)),
              ]),
      ),
    );
  }
}
