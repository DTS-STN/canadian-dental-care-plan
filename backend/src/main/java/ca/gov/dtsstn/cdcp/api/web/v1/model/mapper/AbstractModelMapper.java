package ca.gov.dtsstn.cdcp.api.web.v1.model.mapper;

import java.util.List;

import org.springframework.hateoas.CollectionModel;
import org.springframework.hateoas.Links;
import org.springframework.hateoas.server.core.EmbeddedWrappers;
import org.springframework.util.Assert;

public abstract class AbstractModelMapper {

	public static <C> CollectionModel<C> wrapCollection(CollectionModel<C> collectionModel, Class<C> type) {
		Assert.notNull(collectionModel, "collectionModel is required; it must not be null");
		Assert.notNull(type, "type is requred; it must not be null");

		return collectionModel.getContent().isEmpty() ? emptyCollection(type, collectionModel.getLinks()) : collectionModel;
	}

	@SuppressWarnings({ "unchecked" })
	protected static <C> CollectionModel<C> emptyCollection(Class<C> type, Links links) {
		Assert.notNull(type, "type is requred; it must not be null");
		Assert.notNull(links, "links is required; it must not be null");

		final var emptyWrapper = new EmbeddedWrappers(false).emptyCollectionOf(type);
		return (CollectionModel<C>) CollectionModel.of(List.of(emptyWrapper), links);
	}

}
