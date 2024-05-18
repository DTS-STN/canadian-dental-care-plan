package ca.gov.dtsstn.cdcp.api.web.v1.model.mapper;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.NullValuePropertyMappingStrategy;

import ca.gov.dtsstn.cdcp.api.service.domain.ConfirmationCode;
import ca.gov.dtsstn.cdcp.api.web.v1.model.ConfirmationCodeModel;
import jakarta.annotation.Nullable;

@Mapper
public interface ConfirmationCodeModelMapper {

	@Nullable
	@BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
	ConfirmationCodeModel toModel(@Nullable ConfirmationCode confirmationCode);

}
