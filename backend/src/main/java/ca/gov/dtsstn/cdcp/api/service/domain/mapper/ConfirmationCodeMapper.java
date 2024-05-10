package ca.gov.dtsstn.cdcp.api.service.domain.mapper;
import java.util.List;
import java.util.stream.StreamSupport;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.lang.Nullable;


import ca.gov.dtsstn.cdcp.api.data.entity.ConfirmationCodeEntity;

import ca.gov.dtsstn.cdcp.api.service.domain.ConfirmationCode;
import ca.gov.dtsstn.cdcp.api.service.domain.Subscription;


@Mapper(componentModel = "spring")
public interface ConfirmationCodeMapper {
    
    @Nullable
	ConfirmationCode fromEntity(@Nullable ConfirmationCodeEntity confirmationCodeEntity);

    
    @Nullable
	@Mapping(target = "isNew", ignore = true)
	ConfirmationCodeEntity toEntity(@Nullable ConfirmationCode confirmationCode);


	@Nullable
	public default List<ConfirmationCode> fromEntity(@Nullable Iterable<ConfirmationCodeEntity> confirmationCodes) {
		if (confirmationCodes == null) { return null; }
		return StreamSupport.stream(confirmationCodes.spliterator(), false).map(this::fromEntity).toList();
	}
}
