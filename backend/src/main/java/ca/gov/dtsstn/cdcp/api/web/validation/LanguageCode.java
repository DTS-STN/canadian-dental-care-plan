package ca.gov.dtsstn.cdcp.api.web.validation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import ca.gov.dtsstn.cdcp.api.web.validation.LanguageCodeValidator.CodeType;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;

@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = { LanguageCodeValidator.class })
@Target({ ElementType.ANNOTATION_TYPE, ElementType.CONSTRUCTOR, ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER, ElementType.TYPE_USE })
public @interface LanguageCode {

	CodeType codeType();

	String message();

	Class<?>[] groups() default { };

	Class<? extends Payload>[] payload() default { };

}
