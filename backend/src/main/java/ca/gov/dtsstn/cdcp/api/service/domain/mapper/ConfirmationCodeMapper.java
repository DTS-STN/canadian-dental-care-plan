package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import ca.gov.dtsstn.cdcp.api.data.entity.ConfirmationCodeEntity;
import ca.gov.dtsstn.cdcp.api.service.domain.ConfirmationCode;
import jakarta.annotation.Nullable;

@Mapper
public interface ConfirmationCodeMapper {

	@Nullable
	ConfirmationCode fromEntity(@Nullable ConfirmationCodeEntity confirmationCode);

	@Nullable
	@Mapping(target = "isNew", ignore = true)
	ConfirmationCodeEntity toEntity(@Nullable ConfirmationCode confirmationCode);

}
