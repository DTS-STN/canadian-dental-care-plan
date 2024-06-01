package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import static java.util.Collections.emptyList;
import static java.util.function.Predicate.not;

import java.util.Collection;
import java.util.Optional;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;

import ca.gov.dtsstn.cdcp.api.data.entity.ConfirmationCodeEntity;
import ca.gov.dtsstn.cdcp.api.service.domain.ConfirmationCode;
import jakarta.annotation.Nullable;

/**
 * Mapper for converting between {@link ConfirmationCode} domain objects and {@link ConfirmationCodeEntity} entities.
 */
@Mapper
public abstract class ConfirmationCodeMapper extends AbstractDomainMapper {

	/**
	 * Converts a {@link ConfirmationCodeEntity} to a {@link ConfirmationCode} domain object.
	 */
	@Nullable
	public abstract ConfirmationCode toConfirmationCode(@Nullable ConfirmationCodeEntity confirmationCode);

	/**
	 * Converts a {@link ConfirmationCode} domain object to a {@link ConfirmationCodeEntity} entity.
	 */
	@Nullable
	@Mapping(target = "isNew", ignore = true)
	public abstract ConfirmationCodeEntity toConfirmationCodeEntity(@Nullable ConfirmationCode confirmationCode);

	/**
	 * Updates a set of {@link ConfirmationCodeEntity} entities based on a provided collection of {@link ConfirmationCode} objects.
	 *
	 * This method iterates through the given `confirmationCodes` collection (if not null). For each `ConfirmationCode`:
	 *  - If it's not already present in the `confirmationCodeEntities` set (based on ID comparison), it's converted to a
	 *    `ConfirmationCodeEntity` using the `toEntity` method and added to the set.
	 *  - If it's present in the `confirmationCodeEntities` set but not in the `confirmationCodes` collection, it's removed from the set.
	 *
	 * Essentially, this method synchronizes the `confirmationCodeEntities` set with the provided `confirmationCodes` collection
	 * based on ID equality.
	 */
	@Named("updateConfirmationCodeEntities")
	protected void updateConfirmationCodeEntities(@MappingTarget Collection<ConfirmationCodeEntity> confirmationCodeEntities, @Nullable Collection<ConfirmationCode> confirmationCodes) {
		final var collection = Optional.ofNullable(confirmationCodes).orElse(emptyList());
		confirmationCodeEntities.addAll(collection.stream().map(this::toConfirmationCodeEntity).toList());
		confirmationCodeEntities.removeIf(not(entityIn(collection)));
	}

}
