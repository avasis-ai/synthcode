import { Validator, ValidationContext } from "../validation/validator";

export class StructuredToolCallValidatorV135 implements Validator {
    validate(context: ValidationContext): { isValid: boolean; errors: string[] } {
        const toolCall = context.getToolCall();
        if (!toolCall) {
            return { isValid: true, errors: [] };
        }

        const errors: string[] = [];

        // 1. Check for required fields in the tool call object itself
        if (!toolCall.name) {
            errors.push("Tool call must specify a 'name'.");
        }
        if (!toolCall.arguments) {
            errors.push("Tool call must specify 'arguments'.");
        }

        // 2. Deep validation of arguments object (assuming arguments is a JSON string or object)
        let args: Record<string, unknown>;
        try {
            if (typeof toolCall.arguments === 'string') {
                args = JSON.parse(toolCall.arguments);
            } else if (typeof toolCall.arguments === 'object' && toolCall.arguments !== null) {
                args = toolCall.arguments;
            } else {
                errors.push("Tool call arguments must be a valid JSON string or object.");
                return { isValid: false, errors };
            }
        } catch (e) {
            errors.push("Failed to parse tool call arguments as JSON.");
            return { isValid: false, errors };
        }

        // 3. Cross-field dependency checks within arguments
        const hasUserId = args.hasOwnProperty('user_id') && args['user_id'] !== undefined && args['user_id'] !== null;
        const hasTenantId = args.hasOwnProperty('tenant_id') && args['tenant_id'] !== undefined && args['tenant_id'] !== null;

        if (hasUserId && !hasTenantId) {
            errors.push("If 'user_id' is present, 'tenant_id' must also be present for scope consistency.");
        }

        if (hasUserId && hasTenantId) {
            const userId = String(args['user_id']);
            const tenantId = String(args['tenant_id']);

            // Example logical check: user_id must be prefixed by tenant_id scope
            if (!userId.startsWith(`${tenantId}:`)) {
                errors.push(`'user_id' (${userId}) does not appear to belong to the specified 'tenant_id' (${tenantId}). Expected format: ${tenantId}:...`);
            }
        }

        // 4. Specific field validation (Example: 'action' must be one of predefined values)
        const allowedActions = ["read", "write", "delete", "query"];
        const action = args.action as string | undefined;
        if (action && !allowedActions.includes(action)) {
            errors.push(`Invalid value for 'action': '${action}'. Must be one of: ${allowedActions.join(', ')}.`);
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}