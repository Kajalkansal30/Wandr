package com.wandr.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Converts Render-style DATABASE_URL (postgres://user:pass@host/db)
 * into Spring JDBC properties.
 */
public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

  @Override
  public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
    String databaseUrl = environment.getProperty("DATABASE_URL");
    if (databaseUrl == null || databaseUrl.isBlank()) return;
    // Already JDBC
    if (databaseUrl.startsWith("jdbc:")) {
      Map<String, Object> map = new HashMap<>();
      map.put("spring.datasource.url", databaseUrl);
      environment.getPropertySources().addFirst(new MapPropertySource("databaseUrlJdbc", map));
      return;
    }
    if (!databaseUrl.startsWith("postgres://") && !databaseUrl.startsWith("postgresql://")) return;

    try {
      URI uri = URI.create(databaseUrl.replace("postgres://", "postgresql://"));
      String userInfo = uri.getUserInfo();
      String user = null;
      String pass = null;
      if (userInfo != null) {
        String[] parts = userInfo.split(":", 2);
        user = URLDecoder.decode(parts[0], StandardCharsets.UTF_8);
        if (parts.length > 1) pass = URLDecoder.decode(parts[1], StandardCharsets.UTF_8);
      }
      String host = uri.getHost();
      int port = uri.getPort() > 0 ? uri.getPort() : 5432;
      String path = uri.getPath() == null ? "" : uri.getPath();
      // Drop query string from path (e.g. ?sslmode=require is handled via JDBC params)
      String dbPart = path.startsWith("/") ? path.substring(1) : path;
      int q = dbPart.indexOf('?');
      String db = q >= 0 ? dbPart.substring(0, q) : dbPart;
      // Render requires SSL
      String jdbc = "jdbc:postgresql://" + host + ":" + port + "/" + db + "?sslmode=require";

      Map<String, Object> map = new HashMap<>();
      map.put("spring.datasource.url", jdbc);
      if (user != null) map.put("spring.datasource.username", user);
      if (pass != null) map.put("spring.datasource.password", pass);
      environment.getPropertySources().addFirst(new MapPropertySource("databaseUrlParsed", map));
    } catch (Exception ignored) {
      // fall through to application.yml defaults
    }
  }

  @Override
  public int getOrder() {
    return Ordered.HIGHEST_PRECEDENCE + 10;
  }
}
