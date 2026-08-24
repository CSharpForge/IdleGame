package com.grandstay.tycoon;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.games.GamesSignInClient;
import com.google.android.gms.games.PlayGames;
import com.google.android.gms.games.PlayGamesSdk;
import com.google.android.gms.games.SnapshotsClient;
import com.google.android.gms.games.snapshot.Snapshot;
import com.google.android.gms.games.snapshot.SnapshotMetadataChange;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Bridges the TS-side PlayGamesPlugin interface
 * (src/platform/playGames/PlayGamesPlugin.ts) to Google Play Games
 * Services v2. Method names/signatures here mirror that TS interface
 * exactly. Verify this against Google's current Play Games Services
 * Android docs before relying on it — the API has shifted across SDK
 * majors, and this hasn't yet been exercised against a real signed-in
 * account (see the plan's Phase D on-device verification step).
 */
@CapacitorPlugin(name = "PlayGames")
public class PlayGamesPlugin extends Plugin {
  private static final int RC_ACHIEVEMENT_UI = 9002;
  private static final int RC_LEADERBOARD_UI = 9003;

  @Override
  public void load() {
    PlayGamesSdk.initialize(getActivity());
  }

  @PluginMethod
  public void signInSilently(PluginCall call) {
    GamesSignInClient client = PlayGames.getGamesSignInClient(getActivity());
    client
        .signIn()
        .addOnSuccessListener(
            authResult -> {
              JSObject ret = new JSObject();
              ret.put("signedIn", authResult != null && authResult.isAuthenticated());
              call.resolve(ret);
            })
        .addOnFailureListener(
            e -> {
              JSObject ret = new JSObject();
              ret.put("signedIn", false);
              call.resolve(ret);
            });
  }

  @PluginMethod
  public void isSignedIn(PluginCall call) {
    GamesSignInClient client = PlayGames.getGamesSignInClient(getActivity());
    client
        .isAuthenticated()
        .addOnSuccessListener(
            authResult -> {
              JSObject ret = new JSObject();
              ret.put("signedIn", authResult != null && authResult.isAuthenticated());
              call.resolve(ret);
            })
        .addOnFailureListener(
            e -> {
              JSObject ret = new JSObject();
              ret.put("signedIn", false);
              call.resolve(ret);
            });
  }

  @PluginMethod
  public void saveSnapshot(PluginCall call) {
    String snapshotName = call.getString("snapshotName");
    String dataJson = call.getString("dataJson");
    if (snapshotName == null || dataJson == null) {
      call.reject("snapshotName and dataJson are required");
      return;
    }

    SnapshotsClient client = PlayGames.getSnapshotsClient(getActivity());
    client
        .open(snapshotName, true, SnapshotsClient.RESOLUTION_POLICY_LONGEST_PLAYTIME)
        .addOnFailureListener(e -> call.reject("Failed to open snapshot for save", e))
        .addOnSuccessListener(
            dataOrConflict -> {
              // A single app instance writing under one Play Games account
              // shouldn't normally see a conflict; if it happens anyway,
              // keep going with the conflicting copy rather than failing
              // the save outright — our own resolveConflict() already
              // decided this write should happen.
              Snapshot snapshot =
                  dataOrConflict.isConflict()
                      ? dataOrConflict.getConflict().getConflictingSnapshot()
                      : dataOrConflict.getData();
              snapshot.getSnapshotContents().writeBytes(dataJson.getBytes(StandardCharsets.UTF_8));
              SnapshotMetadataChange metadataChange = new SnapshotMetadataChange.Builder().build();
              client
                  .commitAndClose(snapshot, metadataChange)
                  .addOnSuccessListener(meta -> call.resolve())
                  .addOnFailureListener(e -> call.reject("Failed to commit snapshot", e));
            });
  }

  @PluginMethod
  public void loadSnapshot(PluginCall call) {
    String snapshotName = call.getString("snapshotName");
    if (snapshotName == null) {
      call.reject("snapshotName is required");
      return;
    }

    SnapshotsClient client = PlayGames.getSnapshotsClient(getActivity());
    client
        .open(snapshotName, true, SnapshotsClient.RESOLUTION_POLICY_LONGEST_PLAYTIME)
        .addOnFailureListener(e -> call.reject("Failed to open snapshot for load", e))
        .addOnSuccessListener(
            dataOrConflict -> {
              Snapshot snapshot =
                  dataOrConflict.isConflict()
                      ? dataOrConflict.getConflict().getConflictingSnapshot()
                      : dataOrConflict.getData();
              JSObject ret = new JSObject();
              try {
                byte[] bytes = snapshot.getSnapshotContents().readFully();
                ret.put("dataJson", bytes.length > 0 ? new String(bytes, StandardCharsets.UTF_8) : null);
              } catch (IOException e) {
                ret.put("dataJson", null);
              }
              client.discardAndClose(snapshot);
              call.resolve(ret);
            });
  }

  @PluginMethod
  public void unlockAchievement(PluginCall call) {
    String achievementId = call.getString("achievementId");
    if (achievementId == null) {
      call.reject("achievementId is required");
      return;
    }
    // Fire-and-forget: queues locally and syncs to Play Games in the
    // background, idempotent if already unlocked.
    PlayGames.getAchievementsClient(getActivity()).unlock(achievementId);
    call.resolve();
  }

  @PluginMethod
  public void submitScore(PluginCall call) {
    String leaderboardId = call.getString("leaderboardId");
    Integer score = call.getInt("score");
    if (leaderboardId == null || score == null) {
      call.reject("leaderboardId and score are required");
      return;
    }
    PlayGames.getLeaderboardsClient(getActivity()).submitScore(leaderboardId, score);
    call.resolve();
  }

  @PluginMethod
  public void showAchievementsUI(PluginCall call) {
    PlayGames.getAchievementsClient(getActivity())
        .getAchievementsIntent()
        .addOnSuccessListener(
            intent -> {
              getActivity().startActivityForResult(intent, RC_ACHIEVEMENT_UI);
              call.resolve();
            })
        .addOnFailureListener(e -> call.reject("Failed to show achievements UI", e));
  }

  @PluginMethod
  public void showLeaderboardUI(PluginCall call) {
    String leaderboardId = call.getString("leaderboardId");
    if (leaderboardId == null) {
      call.reject("leaderboardId is required");
      return;
    }
    PlayGames.getLeaderboardsClient(getActivity())
        .getLeaderboardIntent(leaderboardId)
        .addOnSuccessListener(
            intent -> {
              getActivity().startActivityForResult(intent, RC_LEADERBOARD_UI);
              call.resolve();
            })
        .addOnFailureListener(e -> call.reject("Failed to show leaderboard UI", e));
  }
}
