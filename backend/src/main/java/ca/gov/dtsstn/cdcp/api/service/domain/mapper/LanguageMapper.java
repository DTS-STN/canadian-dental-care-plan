package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import static org.mapstruct.NullValueMappingStrategy.RETURN_DEFAULT;

import org.mapstruct.IterableMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.lang.Nullable;

import ca.gov.dtsstn.cdcp.api.data.entity.LanguageEntity;
import ca.gov.dtsstn.cdcp.api.service.domain.Language;

@Mapper
public interface LanguageMapper {

	@Nullable
	@IterableMapping(nullValueMappingStrategy = RETURN_DEFAULT)
	Language toDomainObject(@Nullable LanguageEntity language);

	@Nullable
	@Mapping(target = "isNew", ignore = true)
	LanguageEntity toEntity(@Nullable Language language);

}
