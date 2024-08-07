package ca.gov.dtsstn.cdcp.api.service;

import java.util.Optional;

import org.mapstruct.factory.Mappers;
import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import ca.gov.dtsstn.cdcp.api.data.repository.AlertTypeRepository;
import ca.gov.dtsstn.cdcp.api.service.domain.AlertType;
import ca.gov.dtsstn.cdcp.api.service.domain.mapper.AlertTypeMapper;
import io.opentelemetry.instrumentation.annotations.WithSpan;

@Service
@CacheConfig(cacheNames = { "alert-types" })
public class AlertTypeService {

	private final AlertTypeMapper alertTypeMapper = Mappers.getMapper(AlertTypeMapper.class);

	private final AlertTypeRepository alertTypeRepository;

	public AlertTypeService(AlertTypeRepository alertTypeRepository) {
		Assert.notNull(alertTypeRepository, "alertTypeRepository is required; it must not be null");
		this.alertTypeRepository = alertTypeRepository;
	}

	@WithSpan
	@Cacheable(key = "{ 'id', #id }", sync = true)
	public Optional<AlertType> readById(String id) {
		Assert.hasText(id, "id is required; it must not be null or blank");
		return alertTypeRepository.findById(id).map(alertTypeMapper::toAlertType);
	}

	@WithSpan
	@Cacheable(key = "{ 'code', #code }", sync = true)
	public Optional<AlertType> readByCode(String code) {
		Assert.hasText(code, "code is required; it must not be null or blank");
		return alertTypeRepository.findByCode(code).map(alertTypeMapper::toAlertType);
	}

}
