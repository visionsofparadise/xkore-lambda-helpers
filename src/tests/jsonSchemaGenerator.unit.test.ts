import { testSchema } from './testSchema';
import { ajv } from '../ajv';

const validate = ajv.compile(testSchema);

it('generates valid schema', () => {
	const result = validate({ testAttribute: 'test' });

	expect(result).toBe(true);
});

it('throws on invalid', () => {
	const result = validate({ testAttribute: 123 });

	expect(result).toBe(false);
});
