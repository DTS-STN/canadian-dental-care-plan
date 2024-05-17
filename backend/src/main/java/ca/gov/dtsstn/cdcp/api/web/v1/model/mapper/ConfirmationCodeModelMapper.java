package ca.gov.dtsstn.cdcp.api.web.v1.model.mapper;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.NullValuePropertyMappingStrategy;

import jakarta.annotation.Nullable;
import ca.gov.dtsstn.cdcp.api.service.domain.ConfirmationCode;
import ca.gov.dtsstn.cdcp.api.web.v1.model.ConfirmationCodeModel;

@Mapper(componentModel = "spring")
public interface ConfirmationCodeModelMapper {

	@Nullable
	@BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
	ConfirmationCodeModel toModel(@Nullable ConfirmationCode code);

}
