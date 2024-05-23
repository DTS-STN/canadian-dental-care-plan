package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.lang.Nullable;

import ca.gov.dtsstn.cdcp.api.data.entity.LanguageEntity;
import ca.gov.dtsstn.cdcp.api.service.domain.Language;

@Mapper
public interface LanguageMapper {

	@Nullable
	Language fromEntity(@Nullable LanguageEntity language);

	@Nullable
	@Mapping(target = "isNew", ignore = true)
	LanguageEntity toEntity(@Nullable Language language);

}
