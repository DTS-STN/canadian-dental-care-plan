package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import static org.mapstruct.NullValueMappingStrategy.RETURN_DEFAULT;

import org.mapstruct.IterableMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import ca.gov.dtsstn.cdcp.api.data.entity.ConfirmationCodeEntity;
import ca.gov.dtsstn.cdcp.api.service.domain.ConfirmationCode;
import jakarta.annotation.Nullable;

@Mapper
public interface ConfirmationCodeMapper {

	@Nullable
	@IterableMapping(nullValueMappingStrategy = RETURN_DEFAULT)
	ConfirmationCode toDomainObject(@Nullable ConfirmationCodeEntity confirmationCode);

	@Nullable
	@Mapping(target = "isNew", ignore = true)
	ConfirmationCodeEntity toEntity(@Nullable ConfirmationCode confirmationCode);

}
