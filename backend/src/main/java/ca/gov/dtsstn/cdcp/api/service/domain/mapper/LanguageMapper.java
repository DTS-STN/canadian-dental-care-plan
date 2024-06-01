package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.lang.Nullable;

import ca.gov.dtsstn.cdcp.api.data.entity.LanguageEntity;
import ca.gov.dtsstn.cdcp.api.service.domain.Language;

/**
 * Mapper for converting between {@link Language} domain objects and {@link LanguageEntity} entities.
 */
@Mapper
public abstract class LanguageMapper extends AbstractDomainMapper {

	/**
	 * Converts a {@link LanguageEntity} to a {@link Language} domain object.
	 */
	@Nullable
	public abstract Language toLanguage(@Nullable LanguageEntity language);

	/**
	 * Converts a {@link Language} domain object to a {@link LanguageEntity} entity.
	 */
	@Nullable
	@Mapping(target = "isNew", ignore = true)
	public abstract LanguageEntity toLanguageEntity(@Nullable Language language);

}
