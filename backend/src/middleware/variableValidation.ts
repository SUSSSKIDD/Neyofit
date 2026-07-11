export type ValidationRule = `regex:${string}`;

interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export class ValidationService {
    private static instance: ValidationService;

    private constructor() { }

    public static getInstance(): ValidationService {
        if (!ValidationService.instance) {
            ValidationService.instance = new ValidationService();
        }
        return ValidationService.instance;
    }

    /**
     * Validates data against a specified regex pattern
     * @param value - The value to validate (string | number | boolean)
     * @param rule - The validation rule (regex pattern)
     * @returns ValidationResult indicating if the value is valid
     */
    public validateData(value: string | number | boolean, rule: ValidationRule): ValidationResult {
        if (!rule.startsWith('regex:')) {
            return { isValid: false, error: 'Invalid validation rule' };
        }

        // Convert value to string, but ensure it's a valid type first
        if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
            return { isValid: false, error: 'Unsupported value type' };
        }

        // return this.validateRegex(String(value), rule.slice(6));

        const result = this.validateRegex(String(value), rule.slice(6));
        // console.log(`Validation result: ${result.isValid ? 'PASS' : 'FAIL'}${result.error ? ` - ${result.error}` : ''}`);
        return result;
    }

    private validateRegex(value: string, pattern: string): ValidationResult {
        // console.log(`validateRegex: Value: ${value}, pattern: ${pattern}`);

        try {
            const regex = new RegExp(pattern);
            return regex.test(value)
                ? { isValid: true }
                : { isValid: false, error: 'Value does not match required pattern' };
        } catch {
            return { isValid: false, error: 'Invalid regex pattern' };
        }
    }
}

// Export singleton instance
export const validationService = ValidationService.getInstance();
