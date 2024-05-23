package ca.gov.dtsstn.cdcp.api.web.validation;

import org.springframework.stereotype.Component;
import org.springframework.util.Assert;

import ca.gov.dtsstn.cdcp.api.service.LanguageService;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

@Component
public class LanguageCodeValidator implements ConstraintValidator<LanguageCode, String> {

	private final LanguageService languageService;

	public LanguageCodeValidator(LanguageService languageService) {
		Assert.notNull(languageService, "languageService is required; it must not be null");
		this.languageService = languageService;
	}

	@Override
	public boolean isValid(String value, ConstraintValidatorContext context) {
		if (value == null) { return true; }
		return languageService.readByMsLocaleCode(value).isPresent();
	}

}
