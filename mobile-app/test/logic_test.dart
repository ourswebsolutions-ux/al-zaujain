import 'package:al_zaujain/core/app_state.dart';
import 'package:al_zaujain/core/i18n.dart';
import 'package:al_zaujain/widgets/export.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('website address', () {
    test('adds https and drops slashes and case', () {
      expect(AppState.normalise('Example.com/'), 'https://example.com');
      expect(AppState.normalise(' https://www.example.com/// '), 'https://www.example.com');
      expect(AppState.normalise('http://192.168.1.5:3000'), 'http://192.168.1.5:3000');
      expect(AppState.normalise('https://example.com/bureau/'), 'https://example.com/bureau');
      expect(AppState.normalise(''), '');
    });
  });

  group('translator', () {
    final t = Translator(ur: {'Proposals': 'رشتے', 'Multan': 'ملتان', '{count} years': '{count} سال'}, patterns: [
      [r'^(.+) proposals$', r'$1 کے رشتے'],
      [r'^Profile (AZ-\d+) received$', r'پروفائل $1 موصول ہو گئی'],
    ]);

    test('English stays as written, with values filled in', () {
      t.lang = 'en';
      expect(t('Proposals'), 'Proposals');
      expect(t('{count} years', {'count': 5}), '5 years');
    });

    test('Urdu uses the website dictionary, its patterns and the app phrases', () {
      t.lang = 'ur';
      expect(t('Proposals'), 'رشتے');
      expect(t('{count} years', {'count': 5}), '5 سال');
      expect(t('Multan proposals'), 'ملتان کے رشتے');
      expect(t('Profile AZ-12 received'), 'پروفائل AZ-12 موصول ہو گئی');
      expect(t('Connect'), 'منسلک کریں');
      expect(t('Something new'), 'Something new');
    });
  });

  test('biodata text matches the website layout', () {
    app.t.lang = 'en';
    final text = biodataText({
      'code': 'AZ-07',
      'headline': null,
      'candidate': [
        {'label': 'Name', 'value': 'Sana (AZ-07)'},
        {'label': 'Age', 'value': 27},
      ],
      'residence': [{'label': 'City', 'value': 'Multan'}],
      'family': [],
      'familyBackground': null,
      'about': 'Kind and caring.',
      'partner': {'demand': 'Educated partner.', 'rows': [{'label': 'Age', 'value': '25 – 32'}]},
      'contact': [],
    });
    expect(text.split('\n').first, 'AL ZAUJAIN | International Marriage Consultancy');
    expect(text, contains('Profile AZ-07'));
    expect(text, contains('CANDIDATE INFORMATION\nName: Sana (AZ-07)\nAge: 27'));
    expect(text, contains('RESIDENCE\nCity: Multan'));
    expect(text, contains('ABOUT THE CANDIDATE\nKind and caring.'));
    expect(text, contains('رشتے کی ضروریات / PARTNER REQUIREMENTS\nEducated partner.'));
    expect(text, contains('PREFERRED PARTNER\nAge: 25 – 32'));
    expect(text, isNot(contains('CONTACT')));
  });
}
