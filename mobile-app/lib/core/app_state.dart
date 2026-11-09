import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api.dart';
import 'i18n.dart';

const appVersion = '1.0.1';

/// The website this build opens by default, set when the APK is built (scripts/build-apk.mjs reads
/// APP_SITE_URL). With it, families never see the address screen. Settings can still change it.
const builtInSite = String.fromEnvironment('AZ_SITE');

/// Everything the app remembers: the connected website, the signed-in session, the language,
/// and the private links of profiles submitted from this phone without an account.
class AppState extends ChangeNotifier {
  AppState._();
  static final AppState instance = AppState._();

  late SharedPreferences _prefs;
  String? domain;
  Api? _api;
  Json config = const {};
  Translator t = Translator();
  Json? account;
  Set<String> saved = {};
  bool ready = false;

  Api get api => _api!;
  bool get connected => _api != null && config.isNotEmpty;
  bool get signedIn => _api?.token != null && account != null;
  Json? get user => account?['user'] as Json?;
  bool get isMember => user?['role'] == 'user';
  int get unreadMessages => (account?['unreadMessages'] as num?)?.toInt() ?? 0;
  int get unreadNotifications => (account?['unreadNotifications'] as num?)?.toInt() ?? 0;
  bool get paid => account?['paid'] == true;
  Json get site => (config['site'] as Map?)?.cast<String, dynamic>() ?? const {};
  String get lang => t.lang;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    t.lang = _prefs.getString('lang') ?? 'en';
    domain = _prefs.getString('domain') ?? (builtInSite.isEmpty ? null : normalise(builtInSite));
    if (domain != null && domain!.isEmpty) domain = null;
    if (domain != null) {
      _api = Api(domain!, token: _prefs.getString('token'), onSignedOut: _expired);
    }
    ready = true;
  }

  /// Turns "example.com" or "https://example.com/" into "https://example.com".
  static String normalise(String input) {
    var value = input.trim();
    if (value.isEmpty) return value;
    if (!RegExp(r'^https?://', caseSensitive: false).hasMatch(value)) value = 'https://$value';
    final uri = Uri.tryParse(value);
    if (uri == null || uri.host.isEmpty) return '';
    return '${uri.scheme.toLowerCase()}://${uri.host.toLowerCase()}${uri.hasPort ? ':${uri.port}' : ''}${uri.path.replaceAll(RegExp(r'/+$'), '')}';
  }

  /// Checks that the address is a compatible Al Zaujain website, then remembers it.
  Future<void> connect(String input) async {
    final base = normalise(input);
    if (base.isEmpty) throw ApiException('This address does not look like an Al Zaujain website.');
    final candidate = Api(base, onSignedOut: _expired);
    final data = await candidate.get('config');
    if (data['app'] != 'al-zaujain') throw ApiException('This address does not look like an Al Zaujain website.');
    final changed = base != domain;
    if (changed && _api?.token != null) {
      try {
        await _api!.post('auth/logout');
      } catch (_) {}
      await _prefs.remove('token');
    }
    domain = base;
    _api = candidate..token = changed ? null : _api?.token;
    config = data;
    await _prefs.setString('domain', base);
    if (changed) {
      account = null;
      saved = {};
      await _prefs.remove('manage_links');
    }
    await _loadDictionary();
    await refreshAccount();
    notifyListeners();
  }

  /// Loads the website's settings and lists. Called when the app opens.
  Future<void> load() async {
    config = await api.get('config');
    await _loadDictionary();
    await refreshAccount();
    notifyListeners();
  }

  Future<void> _loadDictionary() async {
    try {
      final data = await api.get('i18n');
      final lang = t.lang;
      t = Translator(
        ur: (data['ur'] as Map).map((key, value) => MapEntry('$key', '$value')),
        patterns: (data['patterns'] as List).map((item) => (item as List).map((part) => '$part').toList()).toList(),
      )..lang = lang;
    } catch (_) {
      // English still works without the dictionary.
    }
  }

  Future<void> refreshAccount() async {
    if (_api?.token == null) {
      account = null;
      return;
    }
    try {
      account = await api.get('me');
      final dash = isMember ? await api.get('saved') : null;
      if (dash != null) saved = ((dash['profiles'] as List?) ?? []).map((card) => '${card['code']}').toSet();
    } on ApiException catch (error) {
      if (error.status == 401) await _clearSession();
    }
    notifyListeners();
  }

  Future<void> signedInWith(Json result) async {
    api.token = '${result['token']}';
    await _prefs.setString('token', api.token!);
    account = result;
    await refreshAccount();
  }

  Future<void> setToken(String token) async {
    api.token = token;
    await _prefs.setString('token', token);
  }

  Future<void> signOut() async {
    try {
      await api.post('auth/logout');
    } catch (_) {}
    await _clearSession();
    notifyListeners();
  }

  Future<void> _clearSession() async {
    _api?.token = null;
    account = null;
    saved = {};
    await _prefs.remove('token');
  }

  void _expired() {
    _clearSession().then((_) => notifyListeners());
  }

  Future<void> setLanguage(String value) async {
    t.lang = value;
    await _prefs.setString('lang', value);
    notifyListeners();
  }

  void updateAccount(Json data) {
    if (data['user'] != null) account = {...?account, ...data};
    notifyListeners();
  }

  Future<bool> toggleSaved(String code, bool value) async {
    await api.post('saved', {'code': code, 'saved': value});
    if (value) {
      saved.add(code);
    } else {
      saved.remove(code);
    }
    notifyListeners();
    return value;
  }

  // Profiles submitted from this phone without an account, kept by their private manage link.
  List<Json> get manageLinks {
    final raw = _prefs.getString('manage_links');
    if (raw == null) return [];
    return (jsonDecode(raw) as List).cast<Map>().map((item) => item.cast<String, dynamic>()).toList();
  }

  Future<void> rememberManageLink(String code, String token, String name) async {
    final list = manageLinks..removeWhere((item) => item['token'] == token);
    list.insert(0, {'code': code, 'token': token, 'name': name});
    await _prefs.setString('manage_links', jsonEncode(list));
    notifyListeners();
  }

  Future<void> forgetManageLink(String token) async {
    final list = manageLinks..removeWhere((item) => item['token'] == token);
    await _prefs.setString('manage_links', jsonEncode(list));
    notifyListeners();
  }

  // An unfinished profile form survives the app being closed, like the website's draft.
  Json? get formDraft {
    final raw = _prefs.getString('profile_draft');
    return raw == null ? null : (jsonDecode(raw) as Map).cast<String, dynamic>();
  }

  Future<void> saveFormDraft(Json? values) async {
    if (values == null) {
      await _prefs.remove('profile_draft');
    } else {
      await _prefs.setString('profile_draft', jsonEncode(values));
    }
  }
}

AppState get app => AppState.instance;

/// Translate with the website's wording: tr('Proposals'), tr('{count} years', {'count': 5}).
String tr(String? text, [Map<String, Object?>? vars]) => app.t(text, vars);
