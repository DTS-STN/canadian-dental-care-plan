package ca.gov.dtsstn.cdcp.api.service;

import java.util.Optional;

import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import ca.gov.dtsstn.cdcp.api.data.repository.AlertTypeRepository;
import ca.gov.dtsstn.cdcp.api.service.domain.AlertType;
import ca.gov.dtsstn.cdcp.api.service.domain.mapper.AlertTypeMapper;

@Service
@CacheConfig(cacheNames = { "alert-types" })
public class AlertTypeService {

	private final AlertTypeMapper mapper;

	private final AlertTypeRepository repository;

	public AlertTypeService(AlertTypeMapper mapper, AlertTypeRepository repository) {
		Assert.notNull(mapper, "mapper is required; it must not be null");
		Assert.notNull(repository, "repository is required; it must not be null");
		this.mapper = mapper;
		this.repository = repository;
	}

	@Cacheable
	public Optional<AlertType> findById(String id) {
		Assert.hasText(id, "id is required; it must not be null or blank");
		return repository.findById(id).map(mapper::fromEntity);
	}

}
