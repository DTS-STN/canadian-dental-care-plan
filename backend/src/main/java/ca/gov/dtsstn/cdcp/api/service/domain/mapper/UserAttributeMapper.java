package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import static java.util.Collections.emptyList;
import static java.util.function.Predicate.not;

import java.util.Collection;
import java.util.Optional;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;

import ca.gov.dtsstn.cdcp.api.data.entity.UserAttributeEntity;
import ca.gov.dtsstn.cdcp.api.service.domain.UserAttribute;
import jakarta.annotation.Nullable;

/**
 * Mapper for converting between {@link UserAttribute} domain objects and {@link UserAttributeEntity} entities.
 */
@Mapper
public abstract class UserAttributeMapper extends AbstractDomainMapper {

	/**
	 * Converts a {@link UserAttributeEntity} entity to a {@link UserAttribute} domain object.
	 */
	@Nullable
	public abstract UserAttribute toUserAttribute(UserAttributeEntity userAttributeEntity);

	/**
	 * Converts a {@link UserAttribute} domain object to a {@link UserAttributeEntity} entity.
	 */
	@Nullable
	@Mapping(target = "isNew", ignore = true)
	public abstract UserAttributeEntity toUserAttributeEntity(UserAttribute userAttribute);

	/**
	 * Updates a set of {@link UserAttributeEntity} entities based on a provided collection of {@link UserAttribute} objects.
	 *
	 * This method iterates through the given `userAttributes` collection (if not null). For each `UserAttribute`:
	 *  - If it's not already present in the `userAttributeEntities` set (based on ID comparison), it's converted to a
	 *    `UserAttributeEntity` using the `toEntity` method and added to the set.
	 *  - If it's present in the `userAttributeEntities` set but not in the `userAttributes` collection, it's removed from the set.
	 *
	 * Essentially, this method synchronizes the `userAttributeEntities` set with the provided `userAttributes` collection
	 * based on ID equality.
	 */
	@Named("updateUserAttributeEntities")
	protected void updateUserAttributeEntities(@MappingTarget Collection<UserAttributeEntity> userAttributeEntities, @Nullable Collection<UserAttribute> userAttributes) {
		final var collection = Optional.ofNullable(userAttributes).orElse(emptyList());
		userAttributeEntities.addAll(collection.stream().map(this::toUserAttributeEntity).toList());
		userAttributeEntities.removeIf(not(entityIn(collection)));
	}

}
