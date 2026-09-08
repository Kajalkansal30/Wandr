package com.wandr.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.Hashtable;
import java.util.Locale;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.InitialDirContext;

@Service
@Slf4j
public class DomainVerificationService {

  public String extractHost(String website) {
    if (website == null || website.isBlank()) return null;
    String raw = website.trim();
    try {
      if (!raw.contains("://")) raw = "https://" + raw;
      URI uri = URI.create(raw);
      String host = uri.getHost();
      if (host == null) return null;
      host = host.toLowerCase(Locale.ROOT);
      if (host.startsWith("www.")) host = host.substring(4);
      return host;
    } catch (Exception e) {
      return null;
    }
  }

  public boolean hasTxtRecord(String host, String expectedValue) {
    if (host == null || expectedValue == null) return false;
    try {
      Hashtable<String, String> env = new Hashtable<>();
      env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
      InitialDirContext ctx = new InitialDirContext(env);
      Attributes attrs = ctx.getAttributes(host, new String[]{"TXT"});
      Attribute txt = attrs.get("TXT");
      if (txt == null) return false;
      for (int i = 0; i < txt.size(); i++) {
        Object v = txt.get(i);
        if (v == null) continue;
        String s = String.valueOf(v).replace("\"", "").trim();
        if (s.contains(expectedValue) || s.equalsIgnoreCase(expectedValue)) {
          return true;
        }
      }
      return false;
    } catch (Exception e) {
      log.info("DNS TXT lookup failed for {}: {}", host, e.getMessage());
      return false;
    }
  }

  public String emailDomain(String email) {
    if (email == null || !email.contains("@")) return null;
    return email.substring(email.indexOf('@') + 1).trim().toLowerCase(Locale.ROOT);
  }

  public boolean emailMatchesWebsite(String email, String website) {
    String ed = emailDomain(email);
    String host = extractHost(website);
    if (ed == null || host == null) return false;
    return ed.equals(host) || host.endsWith("." + ed) || ed.endsWith("." + host);
  }
}
