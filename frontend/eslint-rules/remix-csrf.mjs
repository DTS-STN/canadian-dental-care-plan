export const remixCsrfRule = {
  create(context) {
    return {
      // Check for export named 'action'
      'ExportNamedDeclaration > FunctionDeclaration[id.name="action"]'(node) {
        if (!bodyHasValidateCsrfToken(node.body)) {
          context.report({ node, messageId: 'missingCsrfValidation' });
        }
      },

      // Check for export const action = async () => {}
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name="action"]'(node) {
        // Handle arrow functions
        if (node.init && (node.init.type === 'ArrowFunctionExpression' || node.init.type === 'FunctionExpression') && node.init.body.type === 'BlockStatement') {
          if (!bodyHasValidateCsrfToken(node.init.body)) {
            context.report({ node, messageId: 'missingCsrfValidation' });
          }
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce CSRF token validation in Remix route actions when present',
    },
    schema: [], // no options
    messages: {
      missingCsrfValidation: 'Route action must call validateCsrfToken function',
    },
  },
};

/**
 * Checks if the function body contains a call to validateCsrfToken.
 */
function bodyHasValidateCsrfToken(body) {
  // Traverse the function body to find validateCsrfToken calls
  const hasValidateCalls = body.body.some((statement) => {
    if (
      statement.type === 'ExpressionStatement' &&
      statement.expression.type === 'AwaitExpression' &&
      statement.expression.argument.type === 'CallExpression' &&
      statement.expression.argument.callee.type === 'Identifier' &&
      statement.expression.argument.callee.name === 'validateCsrfToken'
    ) {
      return true;
    }
    return false;
  });

  return hasValidateCalls;
}
