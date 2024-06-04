package ca.gov.dtsstn.cdcp.api.web.v1.model.mapper;

import java.util.List;
import org.springframework.hateoas.CollectionModel;
import org.springframework.hateoas.server.core.EmbeddedWrappers;
import org.springframework.util.Assert;

public interface AbstractModelMapper {

	final EmbeddedWrappers embeddedWrappers = new EmbeddedWrappers(false);

	@SuppressWarnings({ "unchecked" })
	default <C> CollectionModel<C> wrapCollection(CollectionModel<C> collectionModel, Class<C> type) {
		Assert.notNull(collectionModel, "collectionModel is required; it must not be null");
		Assert.notNull(type, "type is requred; it must not be null");
		return collectionModel.getContent().isEmpty()
				? (CollectionModel<C>) CollectionModel.of(List.of(embeddedWrappers.emptyCollectionOf(type)),
						collectionModel.getLinks())
				: collectionModel;
	}

}
