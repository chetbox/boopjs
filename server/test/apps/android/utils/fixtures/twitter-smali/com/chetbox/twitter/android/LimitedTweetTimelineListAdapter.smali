.class public Lcom/chetbox/twitter/android/LimitedTweetTimelineListAdapter;
.super Lcom/twitter/sdk/android/tweetui/TweetTimelineListAdapter;
.source "LimitedTweetTimelineListAdapter.java"


# instance fields
.field private final mMaxTweets:I


# direct methods
.method public constructor <init>(Landroid/content/Context;Lcom/twitter/sdk/android/tweetui/Timeline;I)V
    .registers 4
    .param p1, "context"    # Landroid/content/Context;
    .param p3, "maxTweets"    # I
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Landroid/content/Context;",
            "Lcom/twitter/sdk/android/tweetui/Timeline",
            "<",
            "Lcom/twitter/sdk/android/core/models/Tweet;",
            ">;I)V"
        }
    .end annotation

    .prologue
    .line 14
    .local p2, "timeline":Lcom/twitter/sdk/android/tweetui/Timeline;, "Lcom/twitter/sdk/android/tweetui/Timeline<Lcom/twitter/sdk/android/core/models/Tweet;>;"
    invoke-direct {p0, p1, p2}, Lcom/twitter/sdk/android/tweetui/TweetTimelineListAdapter;-><init>(Landroid/content/Context;Lcom/twitter/sdk/android/tweetui/Timeline;)V

    .line 15
    iput p3, p0, Lcom/chetbox/twitter/android/LimitedTweetTimelineListAdapter;->mMaxTweets:I

    .line 16
    return-void
.end method


# virtual methods
.method public getCount()I
    .registers 3

    .prologue
    .line 20
    const/16 v0, 0x14

    invoke-super {p0}, Lcom/twitter/sdk/android/tweetui/TweetTimelineListAdapter;->getCount()I

    move-result v1

    invoke-static {v0, v1}, Ljava/lang/Math;->min(II)I

    move-result v0

    return v0
.end method
