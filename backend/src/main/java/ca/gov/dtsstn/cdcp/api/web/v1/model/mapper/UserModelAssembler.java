package ca.gov.dtsstn.cdcp.api.web.v1.model.mapper;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import org.mapstruct.factory.Mappers;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.stereotype.Component;
import org.springframework.util.Assert;

import ca.gov.dtsstn.cdcp.api.service.domain.User;
import ca.gov.dtsstn.cdcp.api.web.model.AbstractModelAssembler;
import ca.gov.dtsstn.cdcp.api.web.v1.controller.SubscriptionsController;
import ca.gov.dtsstn.cdcp.api.web.v1.controller.UsersController;
import ca.gov.dtsstn.cdcp.api.web.v1.model.UserModel;

@Component
public class UserModelAssembler extends AbstractModelAssembler<User, UserModel> {

	private final UserModelMapper userModelMapper = Mappers.getMapper(UserModelMapper.class);

	protected UserModelAssembler(PagedResourcesAssembler<User> pagedResourcesAssembler) {
		super(UsersController.class, UserModel.class, pagedResourcesAssembler);
	}

	@Override
	protected UserModel instantiateModel(User user) {
		Assert.notNull(user, "user is required; it must not be null");
		return userModelMapper.map(user)
			.add(linkTo(methodOn(SubscriptionsController.class).getSubscriptionsByUserId(user.getId())).withRel("subscriptions"));
	}

}
