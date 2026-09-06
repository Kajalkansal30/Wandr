package com.wandr.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Loads KEY=VALUE pairs from backend/.env (or ./.env) into the Spring Environment
 * so local Cloudinary/Supabase secrets work without exporting shell variables.
 */
public class DotEnvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

  @Override
  public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
    Path cwd = Path.of("").toAbsolutePath();
    Path[] candidates = {
        cwd.resolve(".env"),
        cwd.resolve("backend").resolve(".env"),
        cwd.getParent() != null ? cwd.getParent().resolve(".env") : null,
    };

    Map<String, Object> map = new HashMap<>();
    for (Path path : candidates) {
      if (path == null || !Files.isRegularFile(path)) continue;
      try {
        List<String> lines = Files.readAllLines(path);
        for (String raw : lines) {
          String line = raw.trim();
          if (line.isEmpty() || line.startsWith("#")) continue;
          int eq = line.indexOf('=');
          if (eq <= 0) continue;
          String key = line.substring(0, eq).trim();
          String value = line.substring(eq + 1).trim();
          if ((value.startsWith("\"") && value.endsWith("\""))
              || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.substring(1, value.length() - 1);
          }
          // Do not override real OS / Render env
          if (environment.getProperty(key) == null && !map.containsKey(key)) {
            map.put(key, value);
          }
        }
      } catch (IOException ignored) {
        // skip unreadable file
      }
    }

    if (!map.isEmpty()) {
      environment.getPropertySources().addLast(new MapPropertySource("wandrDotEnv", map));
    }
  }

  @Override
  public int getOrder() {
    return Ordered.HIGHEST_PRECEDENCE + 5;
  }
}
