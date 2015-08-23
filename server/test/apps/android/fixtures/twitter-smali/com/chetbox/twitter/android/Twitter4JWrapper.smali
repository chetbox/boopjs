.class public Lcom/chetbox/twitter/android/Twitter4JWrapper;
.super Ljava/lang/Object;
.source "Twitter4JWrapper.java"


# static fields
.field private static sTwitter:Ltwitter4j/Twitter;


# direct methods
.method public constructor <init>()V
    .registers 1

    .prologue
    .line 10
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method

.method public static twitter4j()Ltwitter4j/Twitter;
    .registers 4

    .prologue
    const/4 v3, 0x1

    .line 15
    sget-object v2, Lcom/chetbox/twitter/android/Twitter4JWrapper;->sTwitter:Ltwitter4j/Twitter;

    if-nez v2, :cond_4f

    .line 16
    invoke-static {}, Lcom/twitter/sdk/android/Twitter;->getSessionManager()Lcom/twitter/sdk/android/core/SessionManager;

    move-result-object v2

    invoke-interface {v2}, Lcom/twitter/sdk/android/core/SessionManager;->getActiveSession()Lcom/twitter/sdk/android/core/Session;

    move-result-object v0

    check-cast v0, Lcom/twitter/sdk/android/core/TwitterSession;

    .line 18
    .local v0, "session":Lcom/twitter/sdk/android/core/TwitterSession;
    new-instance v2, Ltwitter4j/conf/ConfigurationBuilder;

    invoke-direct {v2}, Ltwitter4j/conf/ConfigurationBuilder;-><init>()V

    invoke-virtual {v2, v3}, Ltwitter4j/conf/ConfigurationBuilder;->setDebugEnabled(Z)Ltwitter4j/conf/ConfigurationBuilder;

    move-result-object v2

    invoke-virtual {v2, v3}, Ltwitter4j/conf/ConfigurationBuilder;->setJSONStoreEnabled(Z)Ltwitter4j/conf/ConfigurationBuilder;

    move-result-object v2

    const-string v3, "etuz0S4EzzLsMSt0sPVPKRZBh"

    invoke-virtual {v2, v3}, Ltwitter4j/conf/ConfigurationBuilder;->setOAuthConsumerKey(Ljava/lang/String;)Ltwitter4j/conf/ConfigurationBuilder;

    move-result-object v2

    const-string v3, "fMH5rt5suKWqa1vLSfMIWJFBvu7GNoI6yglcXBLdKtEZnhKqsz"

    invoke-virtual {v2, v3}, Ltwitter4j/conf/ConfigurationBuilder;->setOAuthConsumerSecret(Ljava/lang/String;)Ltwitter4j/conf/ConfigurationBuilder;

    move-result-object v3

    invoke-virtual {v0}, Lcom/twitter/sdk/android/core/TwitterSession;->getAuthToken()Lcom/twitter/sdk/android/core/AuthToken;

    move-result-object v2

    check-cast v2, Lcom/twitter/sdk/android/core/TwitterAuthToken;

    iget-object v2, v2, Lcom/twitter/sdk/android/core/TwitterAuthToken;->token:Ljava/lang/String;

    invoke-virtual {v3, v2}, Ltwitter4j/conf/ConfigurationBuilder;->setOAuthAccessToken(Ljava/lang/String;)Ltwitter4j/conf/ConfigurationBuilder;

    move-result-object v3

    invoke-virtual {v0}, Lcom/twitter/sdk/android/core/TwitterSession;->getAuthToken()Lcom/twitter/sdk/android/core/AuthToken;

    move-result-object v2

    check-cast v2, Lcom/twitter/sdk/android/core/TwitterAuthToken;

    iget-object v2, v2, Lcom/twitter/sdk/android/core/TwitterAuthToken;->secret:Ljava/lang/String;

    invoke-virtual {v3, v2}, Ltwitter4j/conf/ConfigurationBuilder;->setOAuthAccessTokenSecret(Ljava/lang/String;)Ltwitter4j/conf/ConfigurationBuilder;

    move-result-object v2

    invoke-virtual {v2}, Ltwitter4j/conf/ConfigurationBuilder;->build()Ltwitter4j/conf/Configuration;

    move-result-object v1

    .line 27
    .local v1, "twitterConfig":Ltwitter4j/conf/Configuration;
    new-instance v2, Ltwitter4j/TwitterFactory;

    invoke-direct {v2, v1}, Ltwitter4j/TwitterFactory;-><init>(Ltwitter4j/conf/Configuration;)V

    invoke-virtual {v2}, Ltwitter4j/TwitterFactory;->getInstance()Ltwitter4j/Twitter;

    move-result-object v2

    sput-object v2, Lcom/chetbox/twitter/android/Twitter4JWrapper;->sTwitter:Ltwitter4j/Twitter;

    .line 29
    :cond_4f
    sget-object v2, Lcom/chetbox/twitter/android/Twitter4JWrapper;->sTwitter:Ltwitter4j/Twitter;

    return-object v2
.end method
