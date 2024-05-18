package ca.gov.dtsstn.cdcp.api.config.properties;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.Min;

/**
 * Caching properties for the application.
 */
@Validated
public class CachingProperties {

	/**
	 * Whether or not caching is enabled or disabled globally.
	 * Defaults to {@code true}.
	 */
	private boolean enabled = true;

	/**
	 * A map of cache names to their corresponding properties.
	 */
	private final Map<String, CacheProperties> caches = new HashMap<>();

	public Map<String, CacheProperties> getCaches() {
		return caches;
	}

	public boolean getEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	/**
	 * Configuration properties for a specific cache.
	 */
	public static class CacheProperties {

		/**
		 * The time in the specified {@code timeUnit} after which an entry
		 * should expire, based on the last time it was accessed.
		 * Must be a non-negative integer.
		 */
		@Min(0)
		private Long expireAfterAccess;

		/**
		 * The time in the specified {@code timeUnit} after which an entry
		 * should expire based on the last time it was modified.
		 * Must be a non-negative integer.
		 */
		@Min(0)
		private Long expireAfterWrite;

		/**
		 * The initial capacity of the cache.
		 * Must be a non-negative integer.
		 */
		@Min(0)
		private Integer initialCapacity;

		/**
		 * The maximum size of the cache.
		 * Must be a non-negative integer.
		 */
		@Min(0)
		private Integer maximumSize;

		/**
		 * Whether or not to record statistics for the cache.
		 * Defaults to {@ true}.
		 */
		private boolean recordStats = true;

		/**
		 * The time unit used for the {@code expireAfterAccess} and {@code expireAfterWrite} fields.
		 * Defaults to {@code TimeUnit.MINUTES}.
		 */
		private TimeUnit timeUnit = TimeUnit.MINUTES;

		public Long getExpireAfterAccess() {
			return expireAfterAccess;
		}

		public void setExpireAfterAccess(Long expireAfterAccess) {
			this.expireAfterAccess = expireAfterAccess;
		}

		public Long getExpireAfterWrite() {
			return expireAfterWrite;
		}

		public void setExpireAfterWrite(Long expireAfterWrite) {
			this.expireAfterWrite = expireAfterWrite;
		}

		public Integer getInitialCapacity() {
			return initialCapacity;
		}

		public void setInitialCapacity(Integer initialCapacity) {
			this.initialCapacity = initialCapacity;
		}

		public Integer getMaximumSize() {
			return maximumSize;
		}

		public void setMaximumSize(Integer maximumSize) {
			this.maximumSize = maximumSize;
		}

		public boolean getRecordStats() {
			return recordStats;
		}

		public void setRecordStats(boolean recordStats) {
			this.recordStats = recordStats;
		}

		public TimeUnit getTimeUnit() {
			return timeUnit;
		}

		public void setTimeUnit(TimeUnit timeUnit) {
			this.timeUnit = timeUnit;
		}

	}

}
