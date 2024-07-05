package ca.gov.dtsstn.cdcp.api.service;

import java.util.Optional;

import org.mapstruct.factory.Mappers;
import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import ca.gov.dtsstn.cdcp.api.data.repository.LanguageRepository;
import ca.gov.dtsstn.cdcp.api.service.domain.Language;
import ca.gov.dtsstn.cdcp.api.service.domain.mapper.LanguageMapper;
import io.opentelemetry.instrumentation.annotations.WithSpan;

@Service
@CacheConfig(cacheNames = { "languages" })
public class LanguageService {

	private final LanguageMapper languageMapper = Mappers.getMapper(LanguageMapper.class);

	private final LanguageRepository languageRepository;

	public LanguageService(LanguageRepository languageRepository) {
		Assert.notNull(languageRepository, "languageRepository is required; it must not be null");
		this.languageRepository = languageRepository;
	}

	@WithSpan
	@Cacheable(key = "{ 'id', #id }", sync = true)
	public Optional<Language> readById(String id) {
		Assert.hasText(id, "id is required; it must not be null or blank");
		return languageRepository.findById(id).map(languageMapper::toLanguage);
	}

	@WithSpan
	@Cacheable(key = "{ 'code', #code }", sync = true)
	public Optional<Language> readByCode(String code) {
		Assert.hasText(code, "code is required; it must not be null or blank");
		return languageRepository.findByCode(code).map(languageMapper::toLanguage);
	}

	@WithSpan
	@Cacheable(key = "{ 'isoCode', #isoCode }", sync = true)
	public Optional<Language> readByIsoCode(String isoCode) {
		Assert.hasText(isoCode, "isoCode is required; it must not be null or blank");
		return languageRepository.findByIsoCode(isoCode).map(languageMapper::toLanguage);
	}

	@WithSpan
	@Cacheable(key = "{ 'msLocaleCode', #msLocaleCode }", sync = true)
	public Optional<Language> readByMsLocaleCode(String msLocaleCode) {
		Assert.hasText(msLocaleCode, "msLocaleCode is required; it must not be null or blank");
		return languageRepository.findByMsLocaleCode(msLocaleCode).map(languageMapper::toLanguage);
	}

}
