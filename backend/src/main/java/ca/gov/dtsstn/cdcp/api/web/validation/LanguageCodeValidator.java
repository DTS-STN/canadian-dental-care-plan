package ca.gov.dtsstn.cdcp.api.web.validation;

import org.springframework.stereotype.Component;
import org.springframework.util.Assert;

import ca.gov.dtsstn.cdcp.api.service.LanguageService;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.apache.commons.lang3.StringUtils;

@Component
public class LanguageCodeValidator implements ConstraintValidator<LanguageCode, String> {

	public enum CodeType {
		INTERNAL_CODE,
		ISO_CODE,
		MS_LOCALE_CODE
	};

	private CodeType codeType;

	private final LanguageService languageService;

	public LanguageCodeValidator(LanguageService languageService) {
		Assert.notNull(languageService, "languageService is required; it must not be null");
		this.languageService = languageService;
	}

	@Override
	public void initialize(LanguageCode constraintAnnotation) {
		this.codeType = constraintAnnotation.codeType();
	}

	@Override
	public boolean isValid(String value, ConstraintValidatorContext context) {
		if (StringUtils.isBlank(value)) { return true; }

		return switch (codeType) {
			case CodeType.INTERNAL_CODE -> languageService.readByCode(value).isPresent();
			case CodeType.ISO_CODE -> languageService.readByIsoCode(value).isPresent();
			case CodeType.MS_LOCALE_CODE -> languageService.readByMsLocaleCode(value).isPresent();
		};
	}

}
