.class Lcom/chetbox/twitter/android/FetchTweetsTask;
.super Landroid/os/AsyncTask;
.source "FetchTweetsTask.java"


# annotations
.annotation system Ldalvik/annotation/Signature;
    value = {
        "Landroid/os/AsyncTask",
        "<",
        "Ljava/lang/Void;",
        "Ljava/lang/Void;",
        "Ljava/util/List",
        "<",
        "Lcom/twitter/sdk/android/core/models/Tweet;",
        ">;>;"
    }
.end annotation


# static fields
.field private static final sGson:Lcom/google/gson/Gson;


# instance fields
.field private final mCallback:Lcom/twitter/sdk/android/core/Callback;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Lcom/twitter/sdk/android/core/Callback",
            "<",
            "Lcom/twitter/sdk/android/tweetui/TimelineResult",
            "<",
            "Lcom/twitter/sdk/android/core/models/Tweet;",
            ">;>;"
        }
    .end annotation
.end field

.field private final mPaging:Ltwitter4j/Paging;


# direct methods
.method static constructor <clinit>()V
    .registers 1

    .prologue
    .line 23
    new-instance v0, Lcom/google/gson/Gson;

    invoke-direct {v0}, Lcom/google/gson/Gson;-><init>()V

    sput-object v0, Lcom/chetbox/twitter/android/FetchTweetsTask;->sGson:Lcom/google/gson/Gson;

    return-void
.end method

.method public constructor <init>(Ltwitter4j/Paging;Lcom/twitter/sdk/android/core/Callback;)V
    .registers 3
    .param p1, "paging"    # Ltwitter4j/Paging;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ltwitter4j/Paging;",
            "Lcom/twitter/sdk/android/core/Callback",
            "<",
            "Lcom/twitter/sdk/android/tweetui/TimelineResult",
            "<",
            "Lcom/twitter/sdk/android/core/models/Tweet;",
            ">;>;)V"
        }
    .end annotation

    .prologue
    .line 28
    .local p2, "callback":Lcom/twitter/sdk/android/core/Callback;, "Lcom/twitter/sdk/android/core/Callback<Lcom/twitter/sdk/android/tweetui/TimelineResult<Lcom/twitter/sdk/android/core/models/Tweet;>;>;"
    invoke-direct {p0}, Landroid/os/AsyncTask;-><init>()V

    .line 29
    iput-object p1, p0, Lcom/chetbox/twitter/android/FetchTweetsTask;->mPaging:Ltwitter4j/Paging;

    .line 30
    iput-object p2, p0, Lcom/chetbox/twitter/android/FetchTweetsTask;->mCallback:Lcom/twitter/sdk/android/core/Callback;

    .line 31
    return-void
.end method

.method private static toTwitterKitTweet(Ltwitter4j/Status;)Lcom/twitter/sdk/android/core/models/Tweet;
    .registers 4
    .param p0, "tweet"    # Ltwitter4j/Status;

    .prologue
    .line 64
    if-nez p0, :cond_4

    .line 65
    const/4 v1, 0x0

    .line 70
    :goto_3
    return-object v1

    .line 69
    :cond_4
    invoke-static {p0}, Ltwitter4j/TwitterObjectFactory;->getRawJSON(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v0

    .line 70
    .local v0, "tweetJson":Ljava/lang/String;
    sget-object v1, Lcom/chetbox/twitter/android/FetchTweetsTask;->sGson:Lcom/google/gson/Gson;

    const-class v2, Lcom/twitter/sdk/android/core/models/Tweet;

    invoke-virtual {v1, v0, v2}, Lcom/google/gson/Gson;->fromJson(Ljava/lang/String;Ljava/lang/Class;)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Lcom/twitter/sdk/android/core/models/Tweet;

    goto :goto_3
.end method


# virtual methods
.method protected bridge synthetic doInBackground([Ljava/lang/Object;)Ljava/lang/Object;
    .registers 3
    .param p1, "x0"    # [Ljava/lang/Object;

    .prologue
    .line 21
    check-cast p1, [Ljava/lang/Void;

    .end local p1    # "x0":[Ljava/lang/Object;
    invoke-virtual {p0, p1}, Lcom/chetbox/twitter/android/FetchTweetsTask;->doInBackground([Ljava/lang/Void;)Ljava/util/List;

    move-result-object v0

    return-object v0
.end method

.method protected varargs doInBackground([Ljava/lang/Void;)Ljava/util/List;
    .registers 9
    .param p1, "_"    # [Ljava/lang/Void;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "([",
            "Ljava/lang/Void;",
            ")",
            "Ljava/util/List",
            "<",
            "Lcom/twitter/sdk/android/core/models/Tweet;",
            ">;"
        }
    .end annotation

    .prologue
    .line 36
    :try_start_0
    invoke-static {}, Lcom/chetbox/twitter/android/Twitter4JWrapper;->twitter4j()Ltwitter4j/Twitter;

    move-result-object v5

    iget-object v6, p0, Lcom/chetbox/twitter/android/FetchTweetsTask;->mPaging:Ltwitter4j/Paging;

    invoke-interface {v5, v6}, Ltwitter4j/Twitter;->getHomeTimeline(Ltwitter4j/Paging;)Ltwitter4j/ResponseList;

    move-result-object v3

    .line 37
    .local v3, "tw4jTweets":Ljava/util/List;, "Ljava/util/List<Ltwitter4j/Status;>;"
    new-instance v4, Ljava/util/ArrayList;

    invoke-interface {v3}, Ljava/util/List;->size()I

    move-result v5

    invoke-direct {v4, v5}, Ljava/util/ArrayList;-><init>(I)V

    .line 38
    .local v4, "tweets":Ljava/util/List;, "Ljava/util/List<Lcom/twitter/sdk/android/core/models/Tweet;>;"
    invoke-interface {v3}, Ljava/util/List;->iterator()Ljava/util/Iterator;

    move-result-object v1

    .local v1, "i$":Ljava/util/Iterator;
    :goto_17
    invoke-interface {v1}, Ljava/util/Iterator;->hasNext()Z

    move-result v5

    if-eqz v5, :cond_30

    invoke-interface {v1}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Ltwitter4j/Status;

    .line 39
    .local v2, "tw4jTweet":Ltwitter4j/Status;
    invoke-static {v2}, Lcom/chetbox/twitter/android/FetchTweetsTask;->toTwitterKitTweet(Ltwitter4j/Status;)Lcom/twitter/sdk/android/core/models/Tweet;

    move-result-object v5

    invoke-interface {v4, v5}, Ljava/util/List;->add(Ljava/lang/Object;)Z
    :try_end_2a
    .catch Ltwitter4j/TwitterException; {:try_start_0 .. :try_end_2a} :catch_2b

    goto :goto_17

    .line 42
    .end local v1    # "i$":Ljava/util/Iterator;
    .end local v2    # "tw4jTweet":Ltwitter4j/Status;
    .end local v3    # "tw4jTweets":Ljava/util/List;, "Ljava/util/List<Ltwitter4j/Status;>;"
    .end local v4    # "tweets":Ljava/util/List;, "Ljava/util/List<Lcom/twitter/sdk/android/core/models/Tweet;>;"
    :catch_2b
    move-exception v0

    .line 43
    .local v0, "e":Ltwitter4j/TwitterException;
    invoke-virtual {v0}, Ltwitter4j/TwitterException;->printStackTrace()V

    .line 44
    const/4 v4, 0x0

    .end local v0    # "e":Ltwitter4j/TwitterException;
    :cond_30
    return-object v4
.end method

.method protected bridge synthetic onPostExecute(Ljava/lang/Object;)V
    .registers 2
    .param p1, "x0"    # Ljava/lang/Object;

    .prologue
    .line 21
    check-cast p1, Ljava/util/List;

    .end local p1    # "x0":Ljava/lang/Object;
    invoke-virtual {p0, p1}, Lcom/chetbox/twitter/android/FetchTweetsTask;->onPostExecute(Ljava/util/List;)V

    return-void
.end method

.method protected onPostExecute(Ljava/util/List;)V
    .registers 9
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/util/List",
            "<",
            "Lcom/twitter/sdk/android/core/models/Tweet;",
            ">;)V"
        }
    .end annotation

    .prologue
    .local p1, "tweets":Ljava/util/List;, "Ljava/util/List<Lcom/twitter/sdk/android/core/models/Tweet;>;"
    const/4 v3, 0x0

    .line 50
    if-nez p1, :cond_10

    .line 51
    iget-object v2, p0, Lcom/chetbox/twitter/android/FetchTweetsTask;->mCallback:Lcom/twitter/sdk/android/core/Callback;

    new-instance v3, Lcom/twitter/sdk/android/core/TwitterException;

    const-string v4, "Could not fetch tweets"

    invoke-direct {v3, v4}, Lcom/twitter/sdk/android/core/TwitterException;-><init>(Ljava/lang/String;)V

    invoke-virtual {v2, v3}, Lcom/twitter/sdk/android/core/Callback;->failure(Lcom/twitter/sdk/android/core/TwitterException;)V

    .line 61
    :goto_f
    return-void

    .line 55
    :cond_10
    invoke-interface {p1}, Ljava/util/List;->size()I

    move-result v2

    if-lez v2, :cond_54

    invoke-interface {p1}, Ljava/util/List;->size()I

    move-result v2

    add-int/lit8 v2, v2, -0x1

    invoke-interface {p1, v2}, Ljava/util/List;->get(I)Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Lcom/twitter/sdk/android/core/models/Tweet;

    invoke-virtual {v2}, Lcom/twitter/sdk/android/core/models/Tweet;->getId()J

    move-result-wide v4

    invoke-static {v4, v5}, Ljava/lang/Long;->valueOf(J)Ljava/lang/Long;

    move-result-object v1

    .line 56
    .local v1, "minPosition":Ljava/lang/Long;
    :goto_2a
    invoke-interface {p1}, Ljava/util/List;->size()I

    move-result v2

    if-lez v2, :cond_56

    const/4 v2, 0x0

    invoke-interface {p1, v2}, Ljava/util/List;->get(I)Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Lcom/twitter/sdk/android/core/models/Tweet;

    invoke-virtual {v2}, Lcom/twitter/sdk/android/core/models/Tweet;->getId()J

    move-result-wide v4

    invoke-static {v4, v5}, Ljava/lang/Long;->valueOf(J)Ljava/lang/Long;

    move-result-object v0

    .line 58
    .local v0, "maxPosition":Ljava/lang/Long;
    :goto_3f
    iget-object v2, p0, Lcom/chetbox/twitter/android/FetchTweetsTask;->mCallback:Lcom/twitter/sdk/android/core/Callback;

    new-instance v4, Lcom/twitter/sdk/android/core/Result;

    new-instance v5, Lcom/twitter/sdk/android/tweetui/TimelineResult;

    new-instance v6, Lcom/twitter/sdk/android/tweetui/TimelineCursor;

    invoke-direct {v6, v1, v0}, Lcom/twitter/sdk/android/tweetui/TimelineCursor;-><init>(Ljava/lang/Long;Ljava/lang/Long;)V

    invoke-direct {v5, v6, p1}, Lcom/twitter/sdk/android/tweetui/TimelineResult;-><init>(Lcom/twitter/sdk/android/tweetui/TimelineCursor;Ljava/util/List;)V

    invoke-direct {v4, v5, v3}, Lcom/twitter/sdk/android/core/Result;-><init>(Ljava/lang/Object;Lretrofit/client/Response;)V

    invoke-virtual {v2, v4}, Lcom/twitter/sdk/android/core/Callback;->success(Lcom/twitter/sdk/android/core/Result;)V

    goto :goto_f

    .end local v0    # "maxPosition":Ljava/lang/Long;
    .end local v1    # "minPosition":Ljava/lang/Long;
    :cond_54
    move-object v1, v3

    .line 55
    goto :goto_2a

    .restart local v1    # "minPosition":Ljava/lang/Long;
    :cond_56
    move-object v0, v3

    .line 56
    goto :goto_3f
.end method
