package ca.gov.dtsstn.cdcp.api.web.v1.model.mapper;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import java.util.stream.StreamSupport;

import org.mapstruct.AfterMapping;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.springframework.hateoas.CollectionModel;

import ca.gov.dtsstn.cdcp.api.service.domain.User;
import ca.gov.dtsstn.cdcp.api.web.v1.controller.ConfirmationCodesController;
import ca.gov.dtsstn.cdcp.api.web.v1.controller.EmailValidationsController;
import ca.gov.dtsstn.cdcp.api.web.v1.controller.SubscriptionsController;
import ca.gov.dtsstn.cdcp.api.web.v1.controller.UsersController;
import ca.gov.dtsstn.cdcp.api.web.v1.model.UserCreateModel;
import ca.gov.dtsstn.cdcp.api.web.v1.model.UserModel;
import ca.gov.dtsstn.cdcp.api.web.v1.model.UserPatchModel;
import jakarta.annotation.Nullable;

@Mapper
public abstract class UserModelMapper extends AbstractModelMapper {

	@Nullable
	public CollectionModel<UserModel> toModel(String raoidcUserId, @Nullable Iterable<User> users) {
		final var userModels = StreamSupport.stream(users.spliterator(), false)
			.map(user -> toModel(user)).toList();

		final var collection = CollectionModel.of(userModels)
			.add(linkTo(methodOn(UsersController.class).search(raoidcUserId)).withSelfRel());

		return wrapCollection(collection, UserModel.class);
	}

	@Nullable
	public abstract UserModel toModel(@Nullable User user);

	@AfterMapping
	public UserModel afterMappingToModel(@MappingTarget UserModel user) {
		return user.add(linkTo(methodOn(UsersController.class).getUserById(user.getId())).withSelfRel())
			.add(linkTo(methodOn(SubscriptionsController.class).getSubscriptionsByUserId(user.getId())).withRel("subscriptions"))
			.add(linkTo(methodOn(EmailValidationsController.class).getEmailValidationByUserId(user.getId())).withRel("emailValidations"))
			.add(linkTo(methodOn(ConfirmationCodesController.class).getConfirmationCodesByUserId(user.getId())).withRel("confirmationCodes"));
	}

	@Nullable
	public abstract UserPatchModel toPatchModel(@Nullable User user);

	@Nullable
	@Mapping(target = "email", ignore = false)
	@BeanMapping(ignoreByDefault = true, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
	public abstract User toDomain(@Nullable UserPatchModel userModel);

	@Nullable
	@Mapping(target = "id", ignore = true)
	@Mapping(target = "createdBy", ignore = true)
	@Mapping(target = "createdDate", ignore = true)
	@Mapping(target = "lastModifiedBy", ignore = true)
	@Mapping(target = "lastModifiedDate", ignore = true)
	public abstract User toDomain(@Nullable UserCreateModel userCreateModel);

}
