package ca.gov.dtsstn.cdcp.api.cache;

import java.util.concurrent.TimeUnit;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.springframework.beans.factory.SmartFactoryBean;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.util.Assert;

import com.github.benmanes.caffeine.cache.Caffeine;

/**
 * A {@link SmartFactoryBean} that generates {@link CaffeineCache} instances.
 *
 * <p>This factory exists because Caffeine caches do not work well
 * with Spring Boot's property binding mechanisms. Using this factory
 * makes it possible to use configuration properties to configure
 * each cache at runtime via {@code application.yml}.
 *
 * <p>Usage:
 *
 * <pre>
 * 	application:
 * 	  caches:
 * 	    my-cache:
 * 	      expire-after-write: 30
 * 	      time-unit: minutes
 * </pre>
 *
 * <pre>
 * 	{@code @ConfigurationProperties("application.caches.my-cache")}
 * 	{@code @Bean CaffeineCacheFactory myCache()} {
 * 		return new CaffeineCacheFactory("my-cache");
 * 	}
 * </pre>
 */
public class CaffeineCacheFactory implements SmartFactoryBean<CaffeineCache> {

	/**
	 * The name of the cache being created. Used in Spring's {@code @Cacheable} annotations.
	 */
	private final String cacheName;

	/**
	 * @see Caffeine#expireAfterAccess(long, java.util.concurrent.TimeUnit)
	 */
	private Long expireAfterAccess;

	/**
	 * @see Caffeine#expireAfterWrite(long, java.util.concurrent.TimeUnit)
	 */
	private Long expireAfterWrite;

	/**
	 * @see Caffeine#initialCapacity(int)
	 */
	private Integer initialCapacity;

	/**
	 * @see Caffeine#maximumSize(long)
	 */
	private Integer maximumSize;

	/**
	 * @see Caffeine#recordStats()
	 */
	private boolean recordStats = true;

	/**
	 * The time unit to use for all time-based cache operations. Default value: {@link TimeUnit#MINUTES}.
	 */
	private TimeUnit timeUnit = TimeUnit.MINUTES;

	/**
	 * Default constructor. Only the cache name is required to instantiate a
	 * {@link CaffeineCache}, so this is the only required field for this factory.
	 */
	public CaffeineCacheFactory(String cacheName) {
		Assert.hasText(cacheName, "cacheName is required; it must not be null or blank");
		this.cacheName = cacheName;
	}

	@Override
	public CaffeineCache getObject() {
		final var caffeine = Caffeine.newBuilder();

		if (expireAfterAccess != null) { caffeine.expireAfterAccess(expireAfterAccess, timeUnit); }
		if (expireAfterWrite != null) { caffeine.expireAfterWrite(expireAfterWrite, timeUnit); }
		if (initialCapacity != null) { caffeine.initialCapacity(initialCapacity); }
		if (maximumSize != null) { caffeine.maximumSize(maximumSize); }
		if (recordStats) { caffeine.recordStats(); }

		return new CaffeineCache(cacheName, caffeine.build());
	}

	@Override
	public Class<?> getObjectType() {
		return CaffeineCache.class;
	}

	@Override
	public boolean isEagerInit() {
		return true;
	}

	public void setExpireAfterAccess(long expireAfterAccess) {
		Assert.isTrue(expireAfterAccess >= 0, "expireAfterAccess must not be negative");
		this.expireAfterAccess = expireAfterAccess;
	}

	public void setExpireAfterWrite(long expireAfterWrite) {
		Assert.isTrue(expireAfterWrite >= 0, "expireAfterWrite must not be negative");
		this.expireAfterWrite = expireAfterWrite;
	}

	public void setInitialCapacity(int initialCapacity) {
		Assert.isTrue(initialCapacity >= 0, "initialCapacity must not be negative");
		this.initialCapacity = initialCapacity;
	}

	public void setMaximumSize(int maximumSize) {
		Assert.isTrue(maximumSize >= 0, "maximumSize must not be negative");
		this.maximumSize = maximumSize;
	}

	public void setRecordStats(boolean recordStats) {
		this.recordStats = recordStats;
	}

	public void setTimeUnit(TimeUnit timeUnit) {
		Assert.notNull(timeUnit, "timeUnit must not be null");
		this.timeUnit = timeUnit;
	}

	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this);
	}

}
