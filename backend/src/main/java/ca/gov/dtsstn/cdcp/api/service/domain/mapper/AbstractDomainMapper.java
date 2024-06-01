package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import static java.util.Collections.emptyList;

import java.util.Collection;
import java.util.Optional;
import java.util.function.Predicate;

import ca.gov.dtsstn.cdcp.api.data.entity.AbstractEntity;
import ca.gov.dtsstn.cdcp.api.service.domain.BaseDomainObject;
import jakarta.annotation.Nullable;

/**
 * Abstract base class for domain mappers.
 * Used to provide helpful methods to subclasses.
 */
public abstract class AbstractDomainMapper {

	/**
	 * Creates a predicate that checks if an {@link AbstractEntity} exists within a given collection of {@link BaseDomainObject}s.
	 *
	 * This method takes an {@link Collection} of {@link BaseDomainObject}s and returns a {@link Predicate} that can be used to test
	 * if a specific {@link AbstractEntity} exists within that collection. The predicate checks for equality based on the entity IDs.
	 */
	protected Predicate<? super AbstractEntity> entityIn(@Nullable Collection<? extends BaseDomainObject> domainObjects) {
		return entity -> Optional.ofNullable(domainObjects).orElse(emptyList()).stream()
			.anyMatch(domainObject -> entity.getId().equals(domainObject.getId()));
	}

}
