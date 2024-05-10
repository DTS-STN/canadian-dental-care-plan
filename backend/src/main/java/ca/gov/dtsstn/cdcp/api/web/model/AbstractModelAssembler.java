package ca.gov.dtsstn.cdcp.api.web.model;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.CollectionModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.hateoas.server.core.EmbeddedWrapper;
import org.springframework.hateoas.server.core.EmbeddedWrappers;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;
import org.springframework.util.Assert;

import ca.gov.dtsstn.cdcp.api.service.domain.BaseDomainObject;

/**
 * A base model assembler that can automate creation of resources and guarantee that a self link is always added.
 */
public abstract class AbstractModelAssembler<T extends BaseDomainObject, D extends BaseResourceModel<?>> extends RepresentationModelAssemblerSupport<T, D> {

	protected final EmbeddedWrappers embeddedWrappers = new EmbeddedWrappers(false);

	protected final PagedResourcesAssembler<T> pagedResourcesAssembler;

	protected AbstractModelAssembler(Class<?> controllerClass, Class<D> resourceType, PagedResourcesAssembler<T> pagedResourcesAssembler) {
		super(controllerClass, resourceType);

		Assert.notNull(pagedResourcesAssembler, "pagedResourcesAssembler is required; it must not be null");
		this.pagedResourcesAssembler = pagedResourcesAssembler;
	}

	@Override
	protected abstract D instantiateModel(T entity);

	@Override
	public D toModel(T entity) {
		Assert.notNull(entity, "entity is required; it must not be null");
		Assert.hasText(entity.getId(), "entity.id is requred; it must not be null or blank");
		return createModelWithId(entity.getId(), entity); // NOSONAR (null values)
	}

	@SuppressWarnings({ "unchecked" })
	public PagedModel<D> toModel(Page<T> page) {
		Assert.notNull(page, "page is required; it must not be null");
		return page.isEmpty() ? (PagedModel<D>) pagedResourcesAssembler.toEmptyModel(page, getResourceType()) : pagedResourcesAssembler.toModel(page, this);
	}

	/**
	 * Convenience method to wrap a {@link CollectionModel} in a Spring HATEOAS
	 * {@link EmbeddedWrapper}. This ensures that any empty collections are
	 * represented as <code>[]</code> in the response (instead of null).
	 * <p>
	 * Note that this method severely abuses Java type erasure to allow controllers to return
	 * {@code CollectionModel<MyModel>} when in fact they could potentially be returning
	 * {@code CollectionModel<EmbeddedWrapper>}, which this method returns if the incoming collection is empty.
	 */
	@SuppressWarnings({ "unchecked" })
	public <C> CollectionModel<C> wrapCollection(CollectionModel<C> collectionModel, Class<C> type) {
		Assert.notNull(collectionModel, "collectionModel is required; it must not be null");
		Assert.notNull(type, "type is requred; it must not be null");
		return collectionModel.getContent().isEmpty() ? (CollectionModel<C>) CollectionModel.of(List.of(embeddedWrappers.emptyCollectionOf(type)), collectionModel.getLinks()) : collectionModel;
	}

}
