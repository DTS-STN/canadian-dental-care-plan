package ca.gov.dtsstn.cdcp.api.web.validation;

import org.springframework.stereotype.Component;
import org.springframework.util.Assert;

import ca.gov.dtsstn.cdcp.api.service.AlertTypeService;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.apache.commons.lang3.StringUtils;

@Component
public class AlertTypeCodeValidator implements ConstraintValidator<AlertTypeCode, String> {

	private final AlertTypeService alertTypeService;

	public AlertTypeCodeValidator(AlertTypeService alertTypeService) {
		Assert.notNull(alertTypeService, "alertTypeService is required; it must not be null");
		this.alertTypeService = alertTypeService;
	}

	@Override
	public boolean isValid(String value, ConstraintValidatorContext context) {
		if (StringUtils.isBlank(value)) { return true; }
		return alertTypeService.readByCode(value).isPresent();
	}

}
