package com.wandr.seed;

import com.wandr.domain.*;
import com.wandr.repo.AnalyticsEventRepository;
import com.wandr.repo.BoostCampaignRepository;
import com.wandr.repo.PlaceMediaRepository;
import com.wandr.repo.PlaceRepository;
import com.wandr.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

  private final UserRepository userRepository;
  private final PlaceRepository placeRepository;
  private final AnalyticsEventRepository analyticsEventRepository;
  private final BoostCampaignRepository boostCampaignRepository;
  private final PlaceMediaRepository placeMediaRepository;
  private final PasswordEncoder passwordEncoder;

  @Override
  public void run(String... args) {
    seedUsers();
    seedPlaces();
    backfillPlaceTrustFields();
    seedDemoAnalyticsAndBoost();
    seedSpots();
  }

  private void backfillPlaceTrustFields() {
    for (Place p : placeRepository.findAll()) {
      boolean dirty = false;
      if (p.getOwnershipStatus() == null) {
        p.setOwnershipStatus(p.getOwner() != null ? OwnershipStatus.OWNER_CLAIMED : OwnershipStatus.UNCLAIMED);
        dirty = true;
      }
      if (p.getOperatingStatus() == null) {
        p.setOperatingStatus(OperatingStatus.OPEN);
        dirty = true;
      }
      if (p.getLocationType() == null) {
        p.setLocationType(LocationType.CAFE);
        dirty = true;
      }
      if (p.getStatus() == PlaceStatus.PENDING) {
        p.setStatus(PlaceStatus.PENDING_REVIEW);
        dirty = true;
      }
      if (p.getTemporarilyClosed() == null) {
        p.setTemporarilyClosed(false);
        dirty = true;
      }
      if (dirty) placeRepository.save(p);
    }
  }

  private void seedUsers() {
    upsertUser("user@wandr.test", "wandr123", "Aanya Explorer", Role.USER);
    upsertUser("owner@wandr.test", "wandr123", "Rahul Owner", Role.OWNER);
    upsertUser("admin@wandr.test", "wandr123", "Kajal Admin", Role.ADMIN);
  }

  private void upsertUser(String email, String password, String name, Role role) {
    if (userRepository.existsByEmailIgnoreCase(email)) return;
    userRepository.save(User.builder()
        .email(email)
        .passwordHash(passwordEncoder.encode(password))
        .displayName(name)
        .role(role)
        .build());
  }

  private void seedDemoAnalyticsAndBoost() {
    User owner = userRepository.findByEmailIgnoreCase("owner@wandr.test").orElse(null);
    Place moon = placeRepository.findByNameIgnoreCase("Moon & Moss Café").orElse(null);
    Place saffron = placeRepository.findByNameIgnoreCase("Saffron & Sage").orElse(null);
    if (owner == null || moon == null) return;

    if (analyticsEventRepository.count() == 0) {
      List<Place> targets = saffron != null ? List.of(moon, saffron) : List.of(moon);
      String[] types = {"place_view", "place_view", "place_view", "menu_view", "menu_view", "save_place", "direction_click", "call_click", "share_place"};
      String[] sources = {"detail", "home", "search", "map", "discover_home"};
      ThreadLocalRandom rnd = ThreadLocalRandom.current();

      for (int day = 0; day < 28; day++) {
        Instant base = Instant.now().minus(day, ChronoUnit.DAYS);
        int eventsToday = 8 + rnd.nextInt(20);
        for (int i = 0; i < eventsToday; i++) {
          Place p = targets.get(rnd.nextInt(targets.size()));
          analyticsEventRepository.save(AnalyticsEvent.builder()
              .eventType(types[rnd.nextInt(types.length)])
              .placeId(p.getId())
              .userId(null)
              .sessionId("seed_" + day + "_" + i)
              .source(sources[rnd.nextInt(sources.length)])
              .device("seed")
              .metadata("{}")
              .createdAt(base.minus(rnd.nextInt(20), ChronoUnit.HOURS))
              .build());
        }
      }
    }

    if (boostCampaignRepository.count() == 0) {
      boostCampaignRepository.save(BoostCampaign.builder()
          .placeId(moon.getId())
          .ownerId(owner.getId())
          .targetRadiusKm(5)
          .audiences("coffee,work")
          .budgetInr(1000)
          .durationDays(7)
          .headline("Quiet pour-overs this week")
          .status(BoostStatus.ACTIVE)
          .startsAt(Instant.now().minus(1, ChronoUnit.DAYS))
          .endsAt(Instant.now().plus(6, ChronoUnit.DAYS))
          .impressions(8420L)
          .profileVisits(427L)
          .directionClicks(61L)
          .build());
    }
  }

  private void seedSpots() {
    if (!placeMediaRepository.findByStatusAndMediaTypeOrderByCreatedAtDesc(MediaStatus.APPROVED, MediaType.VIDEO).isEmpty()) {
      return;
    }
    User user = userRepository.findByEmailIgnoreCase("user@wandr.test").orElse(null);
    Place moon = placeRepository.findByNameIgnoreCase("Moon & Moss Café").orElse(null);
    Place little = placeRepository.findByNameIgnoreCase("Little Corner Café").orElse(null);
    Place brew = placeRepository.findByNameIgnoreCase("Brew & Bloom").orElse(null);
    Place saffron = placeRepository.findByNameIgnoreCase("Saffron & Sage").orElse(null);

    record Seed(Place place, String url, SpotKind kind, String caption, int likes) {}
    List<Seed> seeds = new java.util.ArrayList<>();
    if (moon != null) {
      seeds.add(new Seed(moon,
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          SpotKind.AMBIENCE, "Quiet pour-overs and soft light — worth discovering in Hauz Khas.", 42));
    }
    if (little != null) {
      seeds.add(new Seed(little,
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
          SpotKind.HIDDEN_GEM, "A tiny garden café that still feels under the radar.", 88));
    }
    if (brew != null) {
      seeds.add(new Seed(brew,
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
          SpotKind.FOOD, "Single-origin flat whites and a work-friendly corner.", 31));
    }
    if (saffron != null) {
      seeds.add(new Seed(saffron,
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
          SpotKind.NEW_MENU, "New pistachio tiramisu just landed.", 56));
    }
    if (moon != null) {
      seeds.add(new Seed(moon,
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
          SpotKind.NEW_CAFE, "Freshly opened — still finding its rhythm.", 19));
    }

    for (Seed s : seeds) {
      placeMediaRepository.save(PlaceMedia.builder()
          .placeId(s.place().getId())
          .userId(user != null ? user.getId() : null)
          .url(s.url())
          .mediaType(MediaType.VIDEO)
          .spotKind(s.kind())
          .caption(s.caption())
          .likeCount(s.likes())
          .durationSec(15)
          .source(MediaSource.COMMUNITY)
          .status(MediaStatus.APPROVED)
          .build());
    }
  }

  private void seedPlaces() {
    User owner = userRepository.findByEmailIgnoreCase("owner@wandr.test").orElse(null);

    // name, category, type, desc, address, city, image, lat, lng, rating, reviews, saves, price, avg, badge, openedDaysAgo, tags, bestFor, hours, thisWeek, lastWeek, owner
    upsertPlace("Moon & Moss Café", "Specialty Coffee", "cafe",
        "A serene specialty coffee spot with minimal interiors and hand-brewed pour-overs.",
        "B-12, Hauz Khas Village", "Delhi",
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80",
        28.6328, 77.2197, 4.6, 22, 14, 2, 500, "new", 8,
        "Minimal,Cozy", "Work,Solo,Date", "9 AM – 10 PM", 9, 3, owner, LocationType.CAFE, OwnershipStatus.OWNER_VERIFIED, true);

    upsertPlace("Little Corner Café", "Brunch & Coffee", "cafe",
        "A charming garden café hidden in Champa Gali with aesthetic decor and great brunch.",
        "23, Champa Gali, Saidulajab", "Delhi",
        "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=600&q=80",
        28.6452, 77.2090, 4.8, 38, 9, 2, 600, "hidden-gem", null,
        "Garden,Aesthetic", "Date,Group", "8 AM – 9 PM", 4, 3, null, LocationType.CAFE, OwnershipStatus.UNCLAIMED, false);

    upsertPlace("Brew & Bloom", "Artisan Coffee", "cafe",
        "Bright floral artisan coffee house with single-origin beans — solid WiFi for remote work.",
        "14, Khan Market", "Delhi",
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80",
        28.6180, 77.2295, 4.7, 65, 31, 3, 800, null, null,
        "Floral,Bright", "Work,Solo,Study", "8 AM – 9 PM", 22, 12, owner);

    upsertPlace("Saffron & Sage", "Café & Bakery", "cafe",
        "Newly opened artsy bakery-café with warm interiors and sharing plates.",
        "12A, Shahpur Jat", "Delhi",
        "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=600&q=80",
        28.6390, 77.2250, 4.9, 87, 42, 2, 550, "new", 3,
        "Warm,Artsy", "Date,Group,Work", "9 AM – 10 PM", 28, 11, owner);

    upsertPlace("Naan & Chai", "Street Food", "street-food",
        "Legendary street corner for buttery paranthas and cutting chai.",
        "Paranthewali Gali, Chandni Chowk", "Delhi",
        "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80",
        28.6350, 77.2210, 4.3, 142, 56, 1, 150, null, null,
        "Lively,Authentic", "Group,Solo", "7 AM – 11 PM", 8, 10, owner);

    upsertPlace("Verse Café", "Art Café", "cafe",
        "Part café, part gallery — rotating art exhibitions and espresso.",
        "2nd Floor, Shahpur Jat", "Delhi",
        "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600&q=80",
        28.6220, 77.2150, 4.7, 34, 16, 2, 500, "hidden-gem", null,
        "Artsy,Quiet", "Solo,Study,Date", "10 AM – 9 PM", 6, 5, owner);

    upsertPlace("Desk & Draught", "Cowork Café", "cafe",
        "Long tables, fast WiFi, and endless filter coffee — built for deep work sessions.",
        "3rd Floor, DLF Avenue, Saket", "Delhi",
        "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&q=80",
        28.5245, 77.2066, 4.5, 91, 67, 2, 450, null, null,
        "Quiet,Productive", "Work,Study,Solo", "8 AM – 10 PM", 41, 18, owner);

    upsertPlace("Laptop Lane", "Specialty Coffee", "cafe",
        "Power outlets at every seat, white noise playlists, and flat whites on tap.",
        "A-8, Connaught Place", "Delhi",
        "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=600&q=80",
        28.6315, 77.2167, 4.4, 118, 73, 2, 480, null, null,
        "Quiet,Minimal", "Work,Study", "7:30 AM – 9 PM", 48, 22, owner);

    upsertPlace("Focus Roast", "Specialty Coffee", "cafe",
        "Mezzanine booths for calls, strong pour-overs, and a no-loud-calls policy upstairs.",
        "15, Defence Colony Market", "Delhi",
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80",
        28.5733, 77.2290, 4.6, 54, 41, 2, 520, "new", 12,
        "Quiet,Cozy", "Work,Solo,Study", "8 AM – 8 PM", 19, 7, owner);

    upsertPlace("The Idle Hour", "Late Night Café", "cafe",
        "Candlelit corners and vinyl nights — open until midnight for late study crams.",
        "Lane 3, Hauz Khas Village", "Delhi",
        "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80",
        28.5540, 77.1940, 4.5, 76, 48, 2, 650, null, null,
        "Moody,Late", "Date,Study,Work", "12 PM – 12 AM", 35, 14, owner);

    upsertPlace("Dew Drop Café", "Quiet Café", "cafe",
        "Soft lighting and library nooks — a hidden gem for focused reading and laptops.",
        "Basement, Lodhi Colony Market", "Delhi",
        "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=600&q=80",
        28.5912, 77.2275, 4.8, 29, 22, 1, 350, "hidden-gem", null,
        "Quiet,Bookish", "Study,Solo,Work", "9 AM – 8 PM", 7, 6, owner);

    upsertPlace("Green Terrace", "Garden Café", "cafe",
        "Rooftop greens and string lights — best sunset tables in the neighbourhood.",
        "Rooftop, Greater Kailash I M-Block", "Delhi",
        "https://images.unsplash.com/photo-1442512595331-e89e7384260c?w=600&q=80",
        28.5490, 77.2350, 4.7, 103, 88, 3, 900, null, null,
        "Outdoor,Garden", "Date,Group", "11 AM – 11 PM", 52, 29, owner);

    upsertPlace("Perch Wine & Coffee Bar", "Wine & Coffee", "cafe",
        "European-style counter, natural wines, and excellent people-watching.",
        "Mezzanine, Khan Market", "Delhi",
        "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&q=80",
        28.6002, 77.2270, 4.6, 210, 124, 3, 1200, null, null,
        "Chic,Moody", "Date,Group", "11 AM – 12 AM", 18, 16, owner);

    upsertPlace("Butter & Crust Bakery", "Bakery", "cafe",
        "Sourdough mornings and cardamom buns — grab a pastry and settle in with WiFi.",
        "7, Jungpura Extension", "Delhi",
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80",
        28.5800, 77.2450, 4.5, 67, 35, 2, 400, null, null,
        "Warm,Bakery", "Solo,Work,Group", "8 AM – 7 PM", 24, 11, owner);

    upsertPlace("Chai Point Express", "Chai & Snacks", "street-food",
        "Quick masala chai and samosas under ₹200 for two — no frills, always buzzing.",
        "Near Metro Gate 3, Rajiv Chowk", "Delhi",
        "https://images.unsplash.com/photo-1571934811356-d8a0e4f2d8c0?w=600&q=80",
        28.6329, 77.2195, 4.1, 320, 95, 1, 180, null, null,
        "Budget,Quick", "Solo,Group", "7 AM – 10 PM", 12, 14, owner);

    upsertPlace("Tossin' Tacos", "Food Truck", "food-truck",
        "Mobile Mexican truck with late-night soft tacos near campus.",
        "Outside IIT Delhi Main Gate (weekends)", "Delhi",
        "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
        28.5450, 77.1920, 4.4, 88, 61, 1, 300, "new", 5,
        "Street,Lively", "Group,Solo", "5 PM – 1 AM", 33, 12, owner);

    upsertPlace("Midnight Munchies", "Late Night Eats", "street-food",
        "Burgers and shakes after midnight — the post-exam ritual spot.",
        "Satya Niketan Market", "Delhi",
        "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80",
        28.5680, 77.1680, 4.2, 145, 79, 1, 350, null, null,
        "Late,Casual", "Group,Solo", "8 PM – 3 AM", 44, 19, owner);

    upsertPlace("Mama's Kitchen", "Home-style Meals", "cafe",
        "Comfort thalis and filter coffee — budget-friendly and always full.",
        "28, Lajpat Nagar Central Market", "Delhi",
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
        28.5700, 77.2370, 4.3, 198, 52, 1, 280, null, null,
        "Homely,Budget", "Group,Solo", "11 AM – 10 PM", 9, 11, owner);

    upsertPlace("Sugar Plum Desserts", "Desserts", "cafe",
        "Instagram-worthy plated desserts and pastel interiors.",
        "Ground Floor, Select Citywalk", "Delhi",
        "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80",
        28.5287, 77.2192, 4.6, 156, 110, 2, 600, null, null,
        "Sweet,Aesthetic", "Date,Group", "11 AM – 11 PM", 61, 28, owner);

    upsertPlace("The Rolling Pin", "Café & Bakery", "cafe",
        "Open kitchen bakery with communal tables — good for casual coworking mornings.",
        "9, Vasant Vihar Market", "Delhi",
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80",
        28.5570, 77.1570, 4.4, 72, 28, 2, 480, null, null,
        "Bakery,Bright", "Work,Solo,Group", "8 AM – 8 PM", 15, 9, owner);

    upsertPlace("Olio Pizza", "Casual Dining", "cafe",
        "Wood-fired pizzas and shared tables — lively group hangout, not for quiet work.",
        "M Block Market, Greater Kailash II", "Delhi",
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80",
        28.5340, 77.2420, 4.5, 240, 130, 2, 800, null, null,
        "Lively,Casual", "Group,Date", "12 PM – 11 PM", 20, 18, owner);
  }

  private void upsertPlace(
      String name, String category, String type, String description,
      String address, String city, String image,
      double lat, double lng, double rating, int reviews, int saves,
      int price, int avg, String badge, Integer openedDaysAgo,
      String tags, String bestFor, String hours,
      int savesThisWeek, int savesLastWeek, User owner
  ) {
    LocationType loc = "food-truck".equals(type) ? LocationType.FOOD_TRUCK
        : "street-food".equals(type) ? LocationType.STREET_FOOD
        : LocationType.CAFE;
    OwnershipStatus ownership = owner != null ? OwnershipStatus.OWNER_CLAIMED : OwnershipStatus.UNCLAIMED;
    upsertPlace(name, category, type, description, address, city, image, lat, lng, rating, reviews, saves,
        price, avg, badge, openedDaysAgo, tags, bestFor, hours, savesThisWeek, savesLastWeek, owner,
        loc, ownership, false);
  }

  private void upsertPlace(
      String name, String category, String type, String description,
      String address, String city, String image,
      double lat, double lng, double rating, int reviews, int saves,
      int price, int avg, String badge, Integer openedDaysAgo,
      String tags, String bestFor, String hours,
      int savesThisWeek, int savesLastWeek, User owner,
      LocationType locationType, OwnershipStatus ownershipStatus, boolean fullyVerified
  ) {
    placeRepository.findByNameIgnoreCase(name).ifPresentOrElse(existing -> {
      boolean dirty = false;
      if (existing.getSavesThisWeek() == null || existing.getSavesThisWeek() == 0) {
        existing.setSavesThisWeek(savesThisWeek);
        dirty = true;
      }
      if (existing.getSavesLastWeek() == null || existing.getSavesLastWeek() == 0) {
        existing.setSavesLastWeek(savesLastWeek);
        dirty = true;
      }
      if (existing.getOwnershipStatus() == null) {
        existing.setOwnershipStatus(ownershipStatus);
        dirty = true;
      }
      if (existing.getLocationType() == null) {
        existing.setLocationType(locationType);
        dirty = true;
      }
      if (existing.getOperatingStatus() == null) {
        existing.setOperatingStatus(OperatingStatus.OPEN);
        dirty = true;
      }
      if (existing.getStatus() == PlaceStatus.PENDING) {
        existing.setStatus(PlaceStatus.PENDING_REVIEW);
        dirty = true;
      }
      if (fullyVerified && existing.getOwnershipStatus() != OwnershipStatus.OWNER_VERIFIED) {
        existing.setOwnershipStatus(OwnershipStatus.OWNER_VERIFIED);
        existing.setPhoneVerified(true);
        existing.setLocationVerified(true);
        existing.setVerifiedAt(Instant.now());
        existing.setLastVerifiedAt(Instant.now());
        existing.setLastInformationCheck(Instant.now().minus(3, ChronoUnit.DAYS));
        dirty = true;
      }
      if (ownershipStatus == OwnershipStatus.UNCLAIMED && existing.getOwner() != null
          && "Little Corner Café".equalsIgnoreCase(name)) {
        existing.setOwner(null);
        existing.setOwnershipStatus(OwnershipStatus.UNCLAIMED);
        dirty = true;
      }
      if (dirty) placeRepository.save(existing);
    }, () -> {
      Place.PlaceBuilder b = Place.builder()
          .name(name)
          .category(category)
          .type(type)
          .locationType(locationType)
          .description(description)
          .address(address)
          .city(city)
          .imageUrl(image)
          .lat(lat)
          .lng(lng)
          .rating(rating)
          .reviewCount(reviews)
          .savedCount(saves)
          .priceLevel(price)
          .avgCostForTwo(avg)
          .badge(badge)
          .openedDaysAgo(openedDaysAgo)
          .tags(tags)
          .bestFor(bestFor)
          .hours(hours)
          .savesThisWeek(savesThisWeek)
          .savesLastWeek(savesLastWeek)
          .status(PlaceStatus.APPROVED)
          .ownershipStatus(ownershipStatus)
          .operatingStatus(OperatingStatus.OPEN)
          .owner(owner)
          .lastInformationCheck(Instant.now().minus(2, ChronoUnit.DAYS));
      if (fullyVerified) {
        b.phoneVerified(true).locationVerified(true).communityConfirmed(true)
            .verifiedAt(Instant.now()).lastVerifiedAt(Instant.now()).claimedAt(Instant.now());
      } else if (owner != null) {
        b.claimedAt(Instant.now());
      }
      placeRepository.save(b.build());
    });
  }
}
