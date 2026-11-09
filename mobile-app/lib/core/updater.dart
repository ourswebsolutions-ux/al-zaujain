import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:ota_update/ota_update.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../widgets/common.dart';
import 'api.dart';
import 'app_state.dart';
import 'theme.dart';

/// The Android app updates itself from the website it is connected to. The website's homepage
/// download (public/downloads/app.json) says which build is current; when it is newer than this one,
/// the app offers to download it and opens the Android installer. The APK's checksum is verified first.
class Updater {
  static bool _askedThisLaunch = false;

  static bool get supported => !kIsWeb && defaultTargetPlatform == TargetPlatform.android;

  static Json? get release => (app.config['release'] as Map?)?.cast<String, dynamic>();

  static Future<PackageInfo?> _info() async {
    try {
      return await PackageInfo.fromPlatform();
    } catch (_) {
      return null;
    }
  }

  static Future<String> versionLabel() async {
    final info = await _info();
    return info == null ? appVersion : '${info.version} (${info.buildNumber})';
  }

  /// The newer release, or null when this app is already up to date.
  static Future<Json?> newer() async {
    final latest = release;
    final info = await _info();
    if (latest == null || info == null) return null;
    final current = int.tryParse(info.buildNumber) ?? 0;
    final build = (latest['build'] as num?)?.toInt() ?? 0;
    return build > current ? latest : null;
  }

  /// Called once when the app opens; [manual] is the "Check for updates" button in Settings.
  static Future<void> check(BuildContext context, {bool manual = false}) async {
    if (!supported) {
      if (manual) showMessage(context, 'Updates for this phone come from the app store.');
      return;
    }
    if (!manual && _askedThisLaunch) return;
    _askedThisLaunch = true;
    final latest = await newer();
    if (!context.mounted) return;
    if (latest == null) {
      if (manual) showMessage(context, 'You have the latest version of the app.');
      return;
    }
    final yes = await showDialog<bool>(
      context: context,
      builder: (dialog) => AlertDialog(
        icon: const Icon(Icons.system_update_rounded, color: AppColors.gold, size: 36),
        title: Text(tr('A new version of the app is ready')),
        content: Text(tr('Version {version} brings the latest improvements. It takes a minute and keeps you signed in.', {'version': latest['version']})),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialog, false), child: Text(tr('Later'))),
          FilledButton(style: FilledButton.styleFrom(backgroundColor: AppColors.navy), onPressed: () => Navigator.pop(dialog, true), child: Text(tr('Update now'))),
        ],
      ),
    );
    if (yes == true && context.mounted) await _install(context, latest);
  }

  static Future<void> _install(BuildContext context, Json latest) async {
    final url = app.api.absolute('${latest['url']}');
    final progress = ValueNotifier<String>('0');
    String? failure;
    final done = showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialog) => AlertDialog(
        title: Text(tr('Downloading the update…')),
        content: ValueListenableBuilder<String>(
          valueListenable: progress,
          builder: (context, value, _) {
            final percent = double.tryParse(value);
            return Column(mainAxisSize: MainAxisSize.min, children: [
              LinearProgressIndicator(value: percent == null ? null : percent / 100, color: AppColors.gold, backgroundColor: AppColors.cream),
              const SizedBox(height: 10),
              Text(percent == null ? tr('Opening the installer…') : '${percent.round()}%'),
            ]);
          },
        ),
      ),
    );
    try {
      await for (final event in OtaUpdate().execute(url, destinationFilename: 'al-zaujain-update.apk', sha256checksum: latest['sha256'] as String?)) {
        if (event.status == OtaStatus.DOWNLOADING) {
          progress.value = event.value ?? '0';
        } else if (event.status == OtaStatus.INSTALLING || event.status == OtaStatus.INSTALLATION_DONE) {
          progress.value = 'installing';
          break;
        } else {
          failure = event.status == OtaStatus.CHECKSUM_ERROR ? 'The download was damaged. Please try again.' : 'The update could not be installed. Please try again.';
          break;
        }
      }
    } catch (_) {
      failure = 'The update could not be installed. Please try again.';
    }
    if (context.mounted) Navigator.of(context, rootNavigator: true).pop();
    await done;
    if (failure != null && context.mounted) {
      showMessage(context, failure, error: true);
      // The browser can always fetch the same file.
      await openLink(context, url);
    }
  }
}
