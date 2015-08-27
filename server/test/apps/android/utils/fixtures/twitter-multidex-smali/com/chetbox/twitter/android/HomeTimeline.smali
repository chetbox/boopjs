.class public Lcom/chetbox/twitter/android/HomeTimeline;
.super Ljava/lang/Object;
.source "HomeTimeline.java"

# interfaces
.implements Lcom/twitter/sdk/android/tweetui/Timeline;


# annotations
.annotation system Ldalvik/annotation/Signature;
    value = {
        "Ljava/lang/Object;",
        "Lcom/twitter/sdk/android/tweetui/Timeline",
        "<",
        "Lcom/twitter/sdk/android/core/models/Tweet;",
        ">;"
    }
.end annotation


# direct methods
.method public constructor <init>()V
    .registers 1

    .prologue
    .line 10
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public next(Ljava/lang/Long;Lcom/twitter/sdk/android/core/Callback;)V
    .registers 7
    .param p1, "since"    # Ljava/lang/Long;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/Long;",
            "Lcom/twitter/sdk/android/core/Callback",
            "<",
            "Lcom/twitter/sdk/android/tweetui/TimelineResult",
            "<",
            "Lcom/twitter/sdk/android/core/models/Tweet;",
            ">;>;)V"
        }
    .end annotation

    .prologue
    .line 14
    .local p2, "callback":Lcom/twitter/sdk/android/core/Callback;, "Lcom/twitter/sdk/android/core/Callback<Lcom/twitter/sdk/android/tweetui/TimelineResult<Lcom/twitter/sdk/android/core/models/Tweet;>;>;"
    if-nez p1, :cond_13

    new-instance v0, Ltwitter4j/Paging;

    invoke-direct {v0}, Ltwitter4j/Paging;-><init>()V

    .line 15
    .local v0, "paging":Ltwitter4j/Paging;
    :goto_7
    new-instance v1, Lcom/chetbox/twitter/android/FetchTweetsTask;

    invoke-direct {v1, v0, p2}, Lcom/chetbox/twitter/android/FetchTweetsTask;-><init>(Ltwitter4j/Paging;Lcom/twitter/sdk/android/core/Callback;)V

    const/4 v2, 0x0

    new-array v2, v2, [Ljava/lang/Void;

    invoke-virtual {v1, v2}, Lcom/chetbox/twitter/android/FetchTweetsTask;->execute([Ljava/lang/Object;)Landroid/os/AsyncTask;

    .line 16
    return-void

    .line 14
    .end local v0    # "paging":Ltwitter4j/Paging;
    :cond_13
    new-instance v0, Ltwitter4j/Paging;

    invoke-virtual {p1}, Ljava/lang/Long;->longValue()J

    move-result-wide v2

    invoke-direct {v0, v2, v3}, Ltwitter4j/Paging;-><init>(J)V

    goto :goto_7
.end method

.method public previous(Ljava/lang/Long;Lcom/twitter/sdk/android/core/Callback;)V
    .registers 9
    .param p1, "maxId"    # Ljava/lang/Long;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/Long;",
            "Lcom/twitter/sdk/android/core/Callback",
            "<",
            "Lcom/twitter/sdk/android/tweetui/TimelineResult",
            "<",
            "Lcom/twitter/sdk/android/core/models/Tweet;",
            ">;>;)V"
        }
    .end annotation

    .prologue
    .line 20
    .local p2, "callback":Lcom/twitter/sdk/android/core/Callback;, "Lcom/twitter/sdk/android/core/Callback<Lcom/twitter/sdk/android/tweetui/TimelineResult<Lcom/twitter/sdk/android/core/models/Tweet;>;>;"
    if-nez p1, :cond_13

    new-instance v0, Ltwitter4j/Paging;

    invoke-direct {v0}, Ltwitter4j/Paging;-><init>()V

    .line 21
    .local v0, "paging":Ltwitter4j/Paging;
    :goto_7
    new-instance v1, Lcom/chetbox/twitter/android/FetchTweetsTask;

    invoke-direct {v1, v0, p2}, Lcom/chetbox/twitter/android/FetchTweetsTask;-><init>(Ltwitter4j/Paging;Lcom/twitter/sdk/android/core/Callback;)V

    const/4 v2, 0x0

    new-array v2, v2, [Ljava/lang/Void;

    invoke-virtual {v1, v2}, Lcom/chetbox/twitter/android/FetchTweetsTask;->execute([Ljava/lang/Object;)Landroid/os/AsyncTask;

    .line 22
    return-void

    .line 20
    .end local v0    # "paging":Ltwitter4j/Paging;
    :cond_13
    new-instance v0, Ltwitter4j/Paging;

    invoke-virtual {p1}, Ljava/lang/Long;->longValue()J

    move-result-wide v2

    const-wide/16 v4, 0x1

    sub-long/2addr v2, v4

    invoke-direct {v0, v2, v3}, Ltwitter4j/Paging;-><init>(J)V

    goto :goto_7
.end method
