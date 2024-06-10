package ca.gov.dtsstn.cdcp.api.web.v1.model.mapper;

import java.util.stream.StreamSupport;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.springframework.hateoas.CollectionModel;

import ca.gov.dtsstn.cdcp.api.service.domain.ConfirmationCode;
import ca.gov.dtsstn.cdcp.api.web.v1.model.ConfirmationCodeModel;
import jakarta.annotation.Nullable;

@Mapper
public abstract class ConfirmationCodeModelMapper extends AbstractModelMapper {

	@Nullable
	public CollectionModel<ConfirmationCodeModel> toModel(String userId, @Nullable Iterable<ConfirmationCode> confirmationCodes) {
		final var confirmationCodeModels = StreamSupport.stream(confirmationCodes.spliterator(), false)
			.map(confirmationCode -> toModel(confirmationCode)).toList();

		return wrapCollection(CollectionModel.of(confirmationCodeModels), ConfirmationCodeModel.class);
	}	

	@Nullable
	@BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
	public abstract ConfirmationCodeModel toModel(@Nullable ConfirmationCode confirmationCode);

	@Mapping(target = "createdBy", ignore = true)
	@Mapping(target = "createdDate", ignore = true)
	@Mapping(target = "lastModifiedBy", ignore = true)
	@Mapping(target = "lastModifiedDate", ignore = true)
	public abstract ConfirmationCode toDomain(@Nullable ConfirmationCodeModel confirmationCodeModel);	

}
