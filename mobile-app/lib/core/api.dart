import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;

typedef Json = Map<String, dynamic>;

class ApiException implements Exception {
  ApiException(this.message, [this.status = 0, this.body = const {}]);

  final String message;
  final int status;
  final Json body;

  Map<String, String> get errors => ((body['errors'] as Map?) ?? const {}).map((key, value) => MapEntry('$key', '$value'));
  bool get upgrade => body['upgrade'] == true;
  bool get signedOut => body['signedOut'] == true;
  bool get offline => status == 0;

  @override
  String toString() => message;
}

/// One file in a multipart upload, read into memory (photos are at most 8 MB).
class UploadFile {
  UploadFile(this.field, this.bytes, this.name);
  final String field;
  final Uint8List bytes;
  final String name;
}

const _offline = 'We could not reach the server. Please check your connection and try again.';

/// Talks to the website's /api/mobile endpoints. The token travels as a Bearer header.
class Api {
  Api(this.base, {this.token, this.onSignedOut});

  final String base;
  String? token;
  void Function()? onSignedOut;
  final http.Client _client = http.Client();

  Uri uri(String route, [Map<String, String>? query]) {
    final clean = query == null ? null : (Map.of(query)..removeWhere((key, value) => value.isEmpty));
    return Uri.parse('$base/api/mobile/$route').replace(queryParameters: clean == null || clean.isEmpty ? null : clean);
  }

  /// A full address for a path the server returned, such as /media/photos/x.webp.
  String absolute(String path) => path.startsWith('http') ? path : '$base$path';

  Map<String, String> get authHeaders => token == null ? const {} : {'Authorization': 'Bearer $token'};

  Future<Json> get(String route, [Map<String, String>? query]) => _send(() => _client.get(uri(route, query), headers: authHeaders));

  Future<Json> post(String route, [Object? body]) => _send(() => _client.post(uri(route), headers: {...authHeaders, 'Content-Type': 'application/json'}, body: jsonEncode(body ?? const {})));

  Future<Json> delete(String route, [Object? body]) => _send(() => _client.delete(uri(route), headers: {...authHeaders, 'Content-Type': 'application/json'}, body: jsonEncode(body ?? const {})));

  /// Same multipart form the website sends. Repeated fields (such as remove_photo) are allowed.
  Future<Json> multipart(String route, List<MapEntry<String, String>> fields, List<UploadFile> files) {
    return _send(() async {
      final request = http.MultipartRequest('POST', uri(route))..headers.addAll(authHeaders);
      for (final field in fields) {
        request.files.add(http.MultipartFile.fromString(field.key, field.value));
      }
      for (final file in files) {
        request.files.add(http.MultipartFile.fromBytes(file.field, file.bytes, filename: file.name));
      }
      return http.Response.fromStream(await request.send());
    }, timeout: const Duration(minutes: 3));
  }

  Future<Json> _send(Future<http.Response> Function() run, {Duration timeout = const Duration(seconds: 40)}) async {
    http.Response response;
    try {
      response = await run().timeout(timeout);
    } on TimeoutException {
      throw ApiException(_offline);
    } catch (_) {
      // No connection, a refused connection or a certificate problem.
      throw ApiException(_offline);
    }
    Json body;
    try {
      body = (jsonDecode(utf8.decode(response.bodyBytes)) as Map).cast<String, dynamic>();
    } catch (_) {
      throw ApiException(response.statusCode == 404 ? 'This address does not look like an Al Zaujain website.' : 'Something went wrong. Please try again.', response.statusCode);
    }
    if (response.statusCode >= 400 || body['ok'] == false) {
      final error = ApiException('${body['message'] ?? 'Something went wrong. Please try again.'}', response.statusCode, body);
      if (error.signedOut) onSignedOut?.call();
      throw error;
    }
    return body;
  }
}
