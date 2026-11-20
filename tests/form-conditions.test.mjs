// The conditional questionnaire: every gender and marital-status combination, and each other rule.
// Pure functions only, so it needs no database.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sampleProfile } from './helpers.mjs';

const { ALL_FIELDS, SECTIONS, biodata, validateProfile, visibleProfileFields } = await import('../lib/profile-schema.js');
const { allowedOptions, ruleHolds, withoutHidden } = await import('../lib/form-conditions.js');

const context = { countries: [{ id: 1, name: 'Pakistan' }, { id: 2, name: 'United Kingdom' }] };
const visible = (overrides) => visibleProfileFields(sampleProfile(overrides), context);
const check = (overrides) => validateProfile(sampleProfile(overrides), { context });

const MARRIED = 'Married (seeking second marriage)';
const MARRIED_MAN_FIELDS = ['existing_wives', 'second_marriage_intent', 'existing_family_situation'];
const PREVIOUS_MARRIAGE_FIELDS = ['previous_marriage_duration', 'divorce_details', 'widowed_details', 'previous_spouse_details'];
const CHILD_FIELDS = ['children_count', 'children_details', 'children_living'];
const field = (name) => ALL_FIELDS.find((item) => item.name === name);

describe('rule engine', () => {
  it('reads each kind of rule', () => {
    const values = { a: 'Yes', n: 3, c: 1 };
    assert.equal(ruleHolds({ field: 'a', is: 'yes' }, values), true, 'text compares without case');
    assert.equal(ruleHolds({ field: 'a', in: ['No', 'Yes'] }, values), true);
    assert.equal(ruleHolds({ field: 'a', notIn: ['Yes'] }, values), false);
    assert.equal(ruleHolds({ field: 'b', notIn: ['Yes'] }, values), false, 'notIn needs an answer');
    assert.equal(ruleHolds({ field: 'b', filled: false }, values), true);
    assert.equal(ruleHolds({ field: 'n', gt: 2 }, values), true);
    assert.equal(ruleHolds({ field: 'c', country: 'Pakistan' }, values, context), true);
    assert.equal(ruleHolds({ field: 'c', country: 'Pakistan' }, { c: 2 }, context), false);
    assert.equal(ruleHolds({ field: 'c', country: 'Pakistan' }, { c: 99 }, context), true, 'an unknown country keeps the question');
    assert.equal(ruleHolds({ all: [{ field: 'a', is: 'Yes' }, { not: { field: 'n', gt: 5 } }] }, values), true);
    assert.equal(ruleHolds({ any: [{ field: 'a', is: 'No' }, { field: 'n', gt: 5 }] }, values), false);
  });

  it('every rule only looks at questions asked earlier', () => {
    const order = new Map(ALL_FIELDS.map((item, index) => [item.name, index]));
    const fieldsIn = (rule) => (!rule ? [] : rule.all || rule.any ? (rule.all ?? rule.any).flatMap(fieldsIn) : rule.not ? fieldsIn(rule.not) : [rule.field]);
    for (const item of ALL_FIELDS) {
      for (const name of fieldsIn(item.when)) {
        assert.ok(order.has(name), `${item.name} depends on unknown field ${name}`);
        assert.ok(order.get(name) < order.get(item.name), `${item.name} depends on ${name}, which comes later`);
      }
    }
  });
});

describe('gender and marital status: every combination', () => {
  for (const gender of ['male', 'female']) {
    for (const status of ['Never married', 'Divorced', 'Widowed', 'Separated', MARRIED]) {
      it(`${gender}, ${status}`, () => {
        const shown = visible({ gender, marital_status: status });
        // Second-wife question: women only, never men.
        assert.equal(shown.has('second_wife'), gender === 'female');
        // Married men only.
        for (const name of MARRIED_MAN_FIELDS) assert.equal(shown.has(name), gender === 'male' && status === MARRIED, name);
        // Previous marriage: only after a marriage has ended.
        assert.equal(shown.has('previous_marriage_duration'), ['Divorced', 'Widowed', 'Separated'].includes(status));
        assert.equal(shown.has('divorce_details'), ['Divorced', 'Separated'].includes(status));
        assert.equal(shown.has('previous_spouse_details'), ['Divorced', 'Separated'].includes(status));
        assert.equal(shown.has('widowed_details'), status === 'Widowed');
        // Children: never asked of someone who has never married.
        assert.equal(shown.has('has_children'), status !== 'Never married');
        for (const name of CHILD_FIELDS) assert.equal(shown.has(name), false, `${name} waits for "Do you have children?"`);

        if (gender === 'female' && status === MARRIED) {
          assert.equal(check({ gender, marital_status: status }).errors.marital_status, 'This option does not apply to this profile');
        }
      });
    }
  }

  it('offers "Married" to men only', () => {
    const options = (gender) => allowedOptions(field('marital_status'), { gender }, context);
    assert.ok(options('male').includes(MARRIED));
    assert.ok(!options('female').includes(MARRIED));
  });

  it('shows nothing about marriage until the gender is chosen', () => {
    const shown = visible({ gender: '', marital_status: 'Divorced' });
    for (const name of ['marital_status', 'second_wife', 'has_children', ...MARRIED_MAN_FIELDS, ...PREVIOUS_MARRIAGE_FIELDS]) assert.equal(shown.has(name), false, name);
  });

  it('requires the married-man questions only when they apply', () => {
    const errors = check({ gender: 'male', marital_status: MARRIED }).errors;
    assert.ok(errors.existing_wives);
    assert.ok(errors.second_marriage_intent);
    assert.equal(check({ gender: 'male', marital_status: MARRIED, existing_wives: 1, second_marriage_intent: 'Yes', has_children: 'No' }).ok, true);
    assert.equal(check({ gender: 'male', marital_status: 'Never married' }).ok, true);
  });
});

describe('children', () => {
  it('asks for details only after "Yes"', () => {
    const no = visible({ marital_status: 'Divorced', has_children: 'No' });
    for (const name of CHILD_FIELDS) assert.equal(no.has(name), false);
    const yes = visible({ marital_status: 'Divorced', has_children: 'Yes' });
    for (const name of CHILD_FIELDS) assert.equal(yes.has(name), true);
  });

  it('requires the answer and the number only when shown', () => {
    assert.ok(check({ marital_status: 'Widowed' }).errors.has_children);
    assert.ok(check({ marital_status: 'Widowed', has_children: 'Yes' }).errors.children_count);
    assert.equal(check({ marital_status: 'Widowed', has_children: 'Yes', children_count: 2 }).ok, true);
    assert.equal(check({ marital_status: 'Widowed', has_children: 'No' }).ok, true);
  });

  it('drops answers left behind when the status changes', () => {
    const result = check({ marital_status: 'Never married', has_children: 'Yes', children_count: 2, children_details: 'Son 5', divorce_details: 'Old answer' });
    assert.equal(result.ok, true);
    for (const name of ['has_children', 'children_count', 'children_details', 'divorce_details']) assert.equal(result.data[name], null, name);
  });
});

describe('education and employment', () => {
  const shownFor = (status) => visible({ employment_status: status });
  it('employed: job title, organization and income', () => {
    const shown = shownFor('Employed');
    for (const name of ['occupation', 'job_title', 'organization', 'monthly_income', 'work_location']) assert.ok(shown.has(name), name);
    for (const name of ['business_details', 'current_studies']) assert.ok(!shown.has(name), name);
  });
  it('self-employed and business owners: business details', () => {
    for (const status of ['Self-employed', 'Business owner']) {
      const shown = shownFor(status);
      assert.ok(shown.has('business_details'));
      assert.ok(shown.has('monthly_income'));
      assert.ok(!shown.has('job_title'));
    }
  });
  it('students: current studies, no job questions', () => {
    const shown = shownFor('Student');
    assert.ok(shown.has('current_studies'));
    for (const name of ['occupation', 'job_title', 'organization', 'monthly_income', 'business_details']) assert.ok(!shown.has(name), name);
    assert.ok(check({ employment_status: 'Student', occupation: '' }).errors.current_studies);
    assert.equal(check({ employment_status: 'Student', occupation: '', current_studies: 'BS CS' }).ok, true, 'occupation is not required for students');
  });
  it('not working: no employment details', () => {
    for (const status of ['Not working', 'Homemaker']) {
      const shown = shownFor(status);
      for (const name of ['occupation', 'job_title', 'organization', 'monthly_income', 'business_details', 'current_studies']) assert.ok(!shown.has(name), `${status}: ${name}`);
    }
  });
  it('a typed employment status keeps the work questions', () => {
    assert.ok(shownFor('Government servant').has('occupation'));
  });
  it('specialization only above "Below Matric"', () => {
    assert.ok(!visible({ education_level: 'Below Matric' }).has('degree'));
    assert.ok(visible({ education_level: 'Masters' }).has('degree'));
    assert.ok(!visible({ education_level: 'Matric' }).has('other_qualifications'));
    assert.ok(visible({ education_level: 'Bachelors' }).has('other_qualifications'));
  });
});

describe('religion and residence', () => {
  it('asks the sect for Muslims only', () => {
    assert.ok(visible({ religion: 'Islam' }).has('sect'));
    assert.ok(!visible({ religion: 'Christianity', sect: '' }).has('sect'));
  });
  it('Pakistan: province, city and area; abroad: state and city', () => {
    const pakistan = visible({ country_id: 1 });
    for (const name of ['state', 'city', 'residence_area']) assert.ok(pakistan.has(name), name);
    const abroad = visible({ country_id: 2 });
    assert.ok(abroad.has('state') && abroad.has('city'));
    assert.ok(!abroad.has('residence_area'));
    assert.ok(visible({ country_id: 'Pakistan' }).has('residence_area'), 'a typed country name works too');
  });
  it('property details only after confirming ownership', () => {
    assert.ok(!visible({ owns_property: 'No' }).has('property_details'));
    assert.ok(visible({ owns_property: 'Yes' }).has('property_details'));
  });
});

describe('family', () => {
  it('asks how many are married only when there are siblings', () => {
    const none = visible({ brothers: 0, sisters: 0 });
    for (const name of ['married_brothers', 'married_sisters', 'siblings_details']) assert.ok(!none.has(name), name);
    const some = visible({ brothers: 2, sisters: 0 });
    assert.ok(some.has('married_brothers') && some.has('siblings_details'));
    assert.ok(!some.has('married_sisters'));
  });
  it('rejects more married siblings than siblings', () => {
    assert.ok(check({ brothers: 1, married_brothers: 2 }).errors.married_brothers);
  });
});

describe('partner requirements', () => {
  it('divorced/widowed and children preferences follow the marital preference', () => {
    const never = visible({ pref_marital_status: 'Never married' });
    assert.ok(!never.has('accept_divorced') && !never.has('accept_children'));
    assert.ok(visible({}).has('accept_divorced'), 'no preference yet: the question is asked');
    assert.ok(!visible({ accept_divorced: 'No' }).has('accept_children'));
    assert.ok(visible({ accept_divorced: 'Can be considered' }).has('accept_children'));
    assert.ok(visible({ pref_marital_status: 'Widowed' }).has('accept_children'));
  });
  it('offers a married partner to women only', () => {
    assert.ok(allowedOptions(field('pref_marital_status'), { gender: 'female' }).includes(MARRIED));
    assert.ok(!allowedOptions(field('pref_marital_status'), { gender: 'male' }).includes(MARRIED));
  });
  it('overseas and relocation questions only when relevant', () => {
    assert.ok(!visible({ pref_country: 'Pakistan' }).has('overseas_ok'));
    assert.ok(visible({ pref_country: 'United Kingdom' }).has('overseas_ok'));
    assert.ok(!visible({ overseas_ok: 'No' }).has('relocate_abroad'));
    assert.ok(visible({ overseas_ok: 'Yes' }).has('relocate_abroad'));
  });
  it('sect preference only for a Muslim or open preference; cultural details only when chosen', () => {
    assert.ok(visible({}).has('pref_sect'));
    assert.ok(!visible({ pref_religion: 'Christianity' }).has('pref_sect'));
    assert.ok(!visible({ has_cultural_prefs: 'No' }).has('pref_cultural'));
    assert.ok(visible({ has_cultural_prefs: 'Yes' }).has('pref_cultural'));
  });
});

describe('saved profiles', () => {
  it('a complete sample profile still passes', () => assert.equal(check({}).ok, true));

  it('every question still exists and is stored', () => {
    for (const name of ['children_details', 'second_wife', 'occupation', 'business_details', 'residence_area', 'married_brothers', 'pref_cultural', 'accept_children', 'relocate_abroad']) {
      assert.ok(ALL_FIELDS.some((item) => item.name === name), name);
    }
    assert.equal(SECTIONS.at(-1).key, 'documents');
  });

  it('hides stale answers on the biodata without deleting them', () => {
    const stored = { ...sampleProfile({ marital_status: 'Never married', children_details: 'Old answer', country_name: 'Pakistan' }), has_children: null };
    const data = biodata(stored, 'AZMB-01');
    assert.equal(data.candidate.find((row) => row.label === 'Marital status').value, 'Never married');
    assert.equal(stored.children_details, 'Old answer');
  });

  it('shows children on the biodata', () => {
    const stored = { ...sampleProfile({ marital_status: 'Divorced', has_children: 'Yes', children_count: 2, children_details: 'Son 8, daughter 5', country_name: 'Pakistan' }) };
    assert.equal(biodata(stored, 'AZMB-01').candidate.find((row) => row.label === 'Marital status').value, 'Divorced (2 children: Son 8, daughter 5)');
  });

  it('withoutHidden can blank answers for a form', () => {
    const values = withoutHidden(ALL_FIELDS, sampleProfile({ marital_status: 'Never married', has_children: 'Yes' }), context, '');
    assert.equal(values.has_children, '');
  });
});
