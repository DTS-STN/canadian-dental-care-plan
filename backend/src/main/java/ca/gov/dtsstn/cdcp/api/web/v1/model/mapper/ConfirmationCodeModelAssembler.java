package ca.gov.dtsstn.cdcp.api.web.v1.model.mapper;

import org.springframework.stereotype.Component;

import ca.gov.dtsstn.cdcp.api.service.domain.ConfirmationCode;
import ca.gov.dtsstn.cdcp.api.web.model.AbstractModelAssembler;
import ca.gov.dtsstn.cdcp.api.web.v1.controller.ConfirmationCodeController;
import ca.gov.dtsstn.cdcp.api.web.v1.model.ConfirmationCodeModel;
import org.springframework.data.web.PagedResourcesAssembler;

import org.springframework.util.Assert;

@Component
public class ConfirmationCodeModelAssembler
		extends AbstractModelAssembler<ConfirmationCode, ConfirmationCodeModel> {

	private final ConfirmationCodeModelMapper confirmationCodeModelMapper;

	protected ConfirmationCodeModel instantiateModel(ConfirmationCode code) {
		Assert.notNull(code, "code is required; it must not be null");
		return confirmationCodeModelMapper.toModel(code);
	}

	protected ConfirmationCodeModelAssembler(
			PagedResourcesAssembler<ConfirmationCode> pagedResourcesAssembler,
			ConfirmationCodeModelMapper confirmationCodeModelMapper) {
		super(ConfirmationCodeController.class, ConfirmationCodeModel.class,
				pagedResourcesAssembler);
		Assert.notNull(confirmationCodeModelMapper,
				"confirmationCodeModelMapper is required; it must not be null");
		this.confirmationCodeModelMapper = confirmationCodeModelMapper;
	}

}
