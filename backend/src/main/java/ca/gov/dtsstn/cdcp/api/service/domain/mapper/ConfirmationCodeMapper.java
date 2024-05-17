package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import org.mapstruct.Mapper;

import ca.gov.dtsstn.cdcp.api.data.entity.ConfirmationCodeEntity;
import ca.gov.dtsstn.cdcp.api.service.domain.ConfirmationCode;
import jakarta.annotation.Nullable;

@Mapper(componentModel = "spring")
public interface ConfirmationCodeMapper {

	@Nullable
	ConfirmationCode fromEntity(@Nullable ConfirmationCodeEntity confirmationCode);

}
