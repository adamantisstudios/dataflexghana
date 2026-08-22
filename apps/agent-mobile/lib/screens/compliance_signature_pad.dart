import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:path_provider/path_provider.dart';

import '../theme/app_theme.dart';

/// Simple draw-to-sign pad (matches web signature capture intent).
class ComplianceSignaturePad extends StatefulWidget {
  const ComplianceSignaturePad({super.key, required this.title});
  final String title;

  @override
  State<ComplianceSignaturePad> createState() => _ComplianceSignaturePadState();
}

class _ComplianceSignaturePadState extends State<ComplianceSignaturePad> {
  final GlobalKey _repaintKey = GlobalKey();
  final List<_Stroke> _strokes = [];
  List<Offset> _current = [];

  Future<File?> exportPng() async {
    final boundary = _repaintKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
    if (boundary == null) return null;
    final image = await boundary.toImage(pixelRatio: 3);
    final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
    if (byteData == null) return null;
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/signature_${DateTime.now().millisecondsSinceEpoch}.png');
    await file.writeAsBytes(byteData.buffer.asUint8List());
    return file;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: Column(
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text(
              'Sign inside the box using your finger. This will be uploaded with your form.',
              style: TextStyle(color: DfColors.muted),
            ),
          ),
          Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: DfColors.brand.withValues(alpha: 0.3), width: 2),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: RepaintBoundary(
                  key: _repaintKey,
                  child: GestureDetector(
                    onPanStart: (d) => setState(() => _current = [d.localPosition]),
                    onPanUpdate: (d) => setState(() => _current.add(d.localPosition)),
                    onPanEnd: (_) => setState(() {
                      if (_current.length > 1) _strokes.add(_Stroke(List.from(_current)));
                      _current = [];
                    }),
                    child: CustomPaint(
                      painter: _SignaturePainter(_strokes, _current),
                      child: const SizedBox.expand(),
                    ),
                  ),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => setState(() {
                      _strokes.clear();
                      _current.clear();
                    }),
                    child: const Text('Clear'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: _strokes.isEmpty && _current.isEmpty
                        ? null
                        : () async {
                            final file = await exportPng();
                            if (!context.mounted) return;
                            if (file == null) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Could not save signature')),
                              );
                              return;
                            }
                            Navigator.pop(context, file);
                          },
                    child: const Text('Save signature'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Stroke {
  _Stroke(this.points);
  final List<Offset> points;
}

class _SignaturePainter extends CustomPainter {
  _SignaturePainter(this.strokes, this.current);
  final List<_Stroke> strokes;
  final List<Offset> current;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = DfColors.ink
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    void draw(List<Offset> pts) {
      if (pts.length < 2) return;
      final path = Path()..moveTo(pts.first.dx, pts.first.dy);
      for (var i = 1; i < pts.length; i++) {
        path.lineTo(pts[i].dx, pts[i].dy);
      }
      canvas.drawPath(path, paint);
    }

    for (final s in strokes) {
      draw(s.points);
    }
    draw(current);
  }

  @override
  bool shouldRepaint(covariant _SignaturePainter oldDelegate) => true;
}
