package com.wandr.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Converts Render/Supabase DATABASE_URL (postgres:// or postgresql://)
 * into Spring JDBC properties. Must succeed when DATABASE_URL is set —
 * silent fallback to localhost is what caused empty-dialect crashes on Render.
 */
public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

  // user:pass@host:port/db  (password may contain URL-encoded chars; ':' only splits user/pass once)
  private static final Pattern URL = Pattern.compile(
      "^(?:jdbc:)?postgres(?:ql)?://([^:@/]+):([^@]+)@([^:/?]+)(?::(\\d+))?/([^?]+)(?:\\?.*)?$",
      Pattern.CASE_INSENSITIVE
  );

  @Override
  public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
    String databaseUrl = environment.getProperty("DATABASE_URL");
    if (databaseUrl == null || databaseUrl.isBlank()) return;

    databaseUrl = databaseUrl.trim();
    // Strip accidental quotes from dashboard paste
    if ((databaseUrl.startsWith("\"") && databaseUrl.endsWith("\""))
        || (databaseUrl.startsWith("'") && databaseUrl.endsWith("'"))) {
      databaseUrl = databaseUrl.substring(1, databaseUrl.length() - 1).trim();
    }

    try {
      if (databaseUrl.startsWith("jdbc:postgresql://") || databaseUrl.startsWith("jdbc:postgres://")) {
        // Normalize jdbc:postgres:// → jdbc:postgresql://
        String jdbc = databaseUrl.replace("jdbc:postgres://", "jdbc:postgresql://");
        if (!jdbc.contains("sslmode=")) {
          jdbc += (jdbc.contains("?") ? "&" : "?") + "sslmode=require";
        }
        Map<String, Object> map = new HashMap<>();
        map.put("spring.datasource.url", jdbc);
        environment.getPropertySources().addFirst(new MapPropertySource("databaseUrlJdbc", map));
        return;
      }

      Matcher m = URL.matcher(databaseUrl);
      if (!m.matches()) {
        throw new IllegalArgumentException(
            "DATABASE_URL must look like postgresql://USER:PASSWORD@HOST:5432/postgres"
        );
      }

      String user = URLDecoder.decode(m.group(1), StandardCharsets.UTF_8);
      String pass = URLDecoder.decode(m.group(2), StandardCharsets.UTF_8);
      String host = m.group(3);
      String port = m.group(4) != null ? m.group(4) : "5432";
      String db = m.group(5);
      if (db.contains("/")) {
        db = db.substring(0, db.indexOf('/'));
      }

      String jdbc = "jdbc:postgresql://" + host + ":" + port + "/" + db + "?sslmode=require";

      Map<String, Object> map = new HashMap<>();
      map.put("spring.datasource.url", jdbc);
      map.put("spring.datasource.username", user);
      map.put("spring.datasource.password", pass);
      environment.getPropertySources().addFirst(new MapPropertySource("databaseUrlParsed", map));
    } catch (Exception e) {
      throw new IllegalStateException(
          "Failed to parse DATABASE_URL for Spring datasource. "
              + "On Render use Supabase Session pooler URI (IPv4), not a broken paste. "
              + "Detail: " + e.getMessage(),
          e
      );
    }
  }

  @Override
  public int getOrder() {
    return Ordered.HIGHEST_PRECEDENCE + 10;
  }
}
