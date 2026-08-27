import 'dart:io';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:image/image.dart' as img;

/// Dart port of `lib/face-photo-validation.ts` so a selfie taken in the app is
/// judged by exactly the same rules as one taken on the website, and can be
/// auto-approved instead of always waiting for admin review.
///
/// Thresholds, check order and user-facing copy are kept identical to the web
/// implementation on purpose — if you change one, change both.

const _brightnessMin = 40.0;
const _brightnessMax = 230.0;

/// Laplacian variance below this is treated as blurry.
const _laplacianMin = 50.0;
const _faceMinRatio = 0.18;
const _faceMaxRatio = 0.68;
const _faceEdgeMargin = 0.04;

/// Longest edge the image is scaled to before analysis, matching the web canvas.
const _maxSide = 720;

class FacePhotoValidationResult {
  const FacePhotoValidationResult._({
    required this.ok,
    this.error,
    this.detectorUnavailable = false,
  });

  const FacePhotoValidationResult.pass() : this._(ok: true);

  const FacePhotoValidationResult.fail(String error) : this._(ok: false, error: error);

  /// The device could not run face detection at all (e.g. no Play Services).
  /// Callers should submit for admin review rather than blocking the agent.
  const FacePhotoValidationResult.unavailable()
      : this._(ok: false, detectorUnavailable: true);

  final bool ok;
  final String? error;
  final bool detectorUnavailable;
}

/// Average perceived luminance, same coefficients as the web version.
double _averageBrightness(img.Image image) {
  var sum = 0.0;
  for (final p in image) {
    sum += 0.299 * p.r + 0.587 * p.g + 0.114 * p.b;
  }
  return sum / (image.width * image.height);
}

/// Variance of the Laplacian over a greyscale copy — the standard blur metric.
double _laplacianVariance(img.Image image) {
  final w = image.width;
  final h = image.height;
  if (w < 3 || h < 3) return 0;

  final gray = Float32List(w * h);
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      final p = image.getPixel(x, y);
      gray[y * w + x] = 0.299 * p.r + 0.587 * p.g + 0.114 * p.b;
    }
  }

  var sum = 0.0;
  var sumSq = 0.0;
  var count = 0;
  for (var y = 1; y < h - 1; y++) {
    for (var x = 1; x < w - 1; x++) {
      final i = y * w + x;
      final lap = gray[i - w] + gray[i - 1] - 4 * gray[i] + gray[i + 1] + gray[i + w];
      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }
  if (count == 0) return 0;
  final mean = sum / count;
  return sumSq / count - mean * mean;
}

/// Crops the face box with 10% padding, clamped to the image, as the web does.
img.Image _cropFaceRegion(img.Image image, Rect box) {
  const pad = 0.1;
  final x = math.max(0, (box.left - box.width * pad).floor());
  final y = math.max(0, (box.top - box.height * pad).floor());
  final w = math.min(image.width - x, (box.width * (1 + pad * 2)).ceil());
  final h = math.min(image.height - y, (box.height * (1 + pad * 2)).ceil());
  if (w <= 0 || h <= 0) return image;
  return img.copyCrop(image, x: x, y: y, width: w, height: h);
}

/// Runs the same quality gate the website applies before auto-approving.
///
/// Returns [FacePhotoValidationResult.unavailable] when face detection itself
/// could not run, which is distinct from a photo that genuinely failed.
Future<FacePhotoValidationResult> validateFacePhoto(File file) async {
  img.Image? decoded;
  try {
    decoded = img.decodeImage(await file.readAsBytes());
  } catch (_) {
    decoded = null;
  }
  if (decoded == null) {
    return const FacePhotoValidationResult.fail('Could not read image');
  }

  // Kept so the ML Kit box, which is in original coordinates, can be scaled to
  // the (possibly downscaled) image the ratio checks run against.
  final originalWidth = decoded.width;

  // Match the web canvas downscale so ratios and blur scores are comparable.
  if (decoded.width > _maxSide || decoded.height > _maxSide) {
    final longest = math.max(decoded.width, decoded.height);
    final scale = _maxSide / longest;
    decoded = img.copyResize(
      decoded,
      width: (decoded.width * scale).round(),
      height: (decoded.height * scale).round(),
      interpolation: img.Interpolation.linear,
    );
  }

  final brightness = _averageBrightness(decoded);
  if (brightness < _brightnessMin) {
    return const FacePhotoValidationResult.fail(
      'Photo is too dark. Please take the photo in a well-lit area.',
    );
  }
  if (brightness > _brightnessMax) {
    return const FacePhotoValidationResult.fail(
      'Photo is too bright. Please avoid direct light.',
    );
  }

  final detector = FaceDetector(
    options: FaceDetectorOptions(
      performanceMode: FaceDetectorMode.accurate,
      minFaceSize: 0.1,
    ),
  );

  List<Face> faces;
  try {
    faces = await detector.processImage(InputImage.fromFilePath(file.path));
    debugPrint('[face-check] detector ok, faces=${faces.length}');
  } catch (e) {
    // No Play Services / model unavailable — don't punish the agent for it.
    // Logged because this is otherwise indistinguishable from a failed photo.
    debugPrint('[face-check] detector unavailable: $e');
    return const FacePhotoValidationResult.unavailable();
  } finally {
    await detector.close();
  }

  if (faces.length != 1) {
    return const FacePhotoValidationResult.fail(
      'Please upload a clear photo showing only your face.',
    );
  }

  // ML Kit boxes are in original-image coordinates; the analysis image may have
  // been downscaled, so re-project the box into analysis coordinates.
  final scaleBack = decoded.width / originalWidth;
  final raw = faces.first.boundingBox;
  final box = Rect(
    left: raw.left * scaleBack,
    top: raw.top * scaleBack,
    width: raw.width * scaleBack,
    height: raw.height * scaleBack,
  );

  final faceWidthRatio = box.width / decoded.width;
  final faceHeightRatio = box.height / decoded.height;
  final centerX = box.left + box.width / 2;
  final centerY = box.top + box.height / 2;
  final centered = centerX > decoded.width * 0.32 &&
      centerX < decoded.width * 0.68 &&
      centerY > decoded.height * 0.25 &&
      centerY < decoded.height * 0.66;
  final insideFrame = box.left > decoded.width * _faceEdgeMargin &&
      box.top > decoded.height * _faceEdgeMargin &&
      box.left + box.width < decoded.width * (1 - _faceEdgeMargin) &&
      box.top + box.height < decoded.height * (1 - _faceEdgeMargin);

  if (faceWidthRatio < _faceMinRatio || faceHeightRatio < _faceMinRatio) {
    return const FacePhotoValidationResult.fail(
      'Move closer so your face is clearly visible in the frame.',
    );
  }
  if (faceWidthRatio > _faceMaxRatio || faceHeightRatio > _faceMaxRatio) {
    return const FacePhotoValidationResult.fail(
      'Move the phone back slightly so your full head fits in the frame.',
    );
  }
  if (!insideFrame) {
    return const FacePhotoValidationResult.fail(
      'Keep your full head inside the frame and try again.',
    );
  }
  if (!centered) {
    return const FacePhotoValidationResult.fail(
      'Center your face in the frame and try again.',
    );
  }

  final blurScore = _laplacianVariance(_cropFaceRegion(decoded, box));
  if (blurScore < _laplacianMin) {
    return const FacePhotoValidationResult.fail(
      'Photo is blurry. Please hold the camera steady.',
    );
  }

  return const FacePhotoValidationResult.pass();
}

/// Simple rect in analysis-image coordinates.
class Rect {
  const Rect({
    required this.left,
    required this.top,
    required this.width,
    required this.height,
  });

  final double left;
  final double top;
  final double width;
  final double height;
}
